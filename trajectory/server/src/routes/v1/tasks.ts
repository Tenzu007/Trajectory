import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Task } from '../../db/models/Task.js';
import { Commitment } from '../../db/models/Commitment.js';
import { FocusSession } from '../../db/models/FocusSession.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { buildDailyPlan, priorityScore, gapScore } from '@trajectory/shared';

const router = Router();
router.use(requireAuth);

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  type: z.enum(['study', 'assignment', 'practice', 'skill', 'health', 'other']).default('study'),
  estimatedMinutes: z.number().int().min(5),
  scheduledAt: z.string().transform((v) => new Date(v)),
  courseId: z.string().optional(),
  examId: z.string().optional(),
  backlogId: z.string().optional(),
  skillId: z.string().optional(),
  twoMinuteLaunch: z.string().optional(),
  steps: z.array(z.object({ description: z.string() })).default([]),
  marksAtStake: z.number().min(0).default(10),
  mastery: z.number().min(0).max(1).default(0.5),
  urgencyDays: z.number().int().min(1).default(7),
  effortHours: z.number().min(0.1).default(1),
});

const ReleaseSchema = z.object({
  reason: z.string().optional(),
});

// ─── List tasks ───────────────────────────────────────────────────────────────

router.get('/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, status } = req.query;
    const filter: Record<string, unknown> = { studentId: req.user!.studentId };

    if (date) {
      const day = new Date(date as string);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      filter.scheduledAt = { $gte: day, $lt: next };
    }
    if (status) filter.status = status;

    const tasks = await Task.find(filter).sort({ scheduledAt: 1, priorityScore: -1 }).lean();
    res.json({ data: tasks, error: null });
  } catch (err) { next(err); }
});

// ─── Create task ──────────────────────────────────────────────────────────────

router.post('/tasks', validate(CreateTaskSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof CreateTaskSchema>;

    const score = priorityScore({
      marksAtStake: body.marksAtStake,
      mastery: body.mastery,
      urgencyDays: body.urgencyDays,
      effortHours: body.effortHours,
    });

    const task = await Task.create({
      studentId: req.user!.studentId,
      title: body.title,
      description: body.description,
      type: body.type,
      estimatedMinutes: body.estimatedMinutes,
      scheduledAt: body.scheduledAt,
      courseId: body.courseId,
      examId: body.examId,
      backlogId: body.backlogId,
      skillId: body.skillId,
      twoMinuteLaunch: body.twoMinuteLaunch ?? 'Open your notes to the first page.',
      steps: body.steps.map((s) => ({ description: s.description, completed: false })),
      priorityScore: score,
    });

    // Create matching commitment
    const end = new Date(body.scheduledAt.getTime() + body.estimatedMinutes * 60000);
    await Commitment.create({
      studentId: req.user!.studentId,
      taskId: task._id,
      scheduledStart: body.scheduledAt,
      scheduledEnd: end,
      status: 'kept',
      keepRate: 1,
    });

    res.status(201).json({ data: task, error: null });
  } catch (err) { next(err); }
});

// ─── Update task ──────────────────────────────────────────────────────────────

router.patch('/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, studentId: req.user!.studentId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!task) { res.status(404).json({ data: null, error: 'Task not found.' }); return; }
    res.json({ data: task, error: null });
  } catch (err) { next(err); }
});

// ─── Release task (Integrity Protocol) ───────────────────────────────────────

router.post('/tasks/:id/release', validate(ReleaseSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, studentId: req.user!.studentId });
    if (!task) { res.status(404).json({ data: null, error: 'Task not found.' }); return; }

    // Heuristic projected effect — will be refined in Phase 3 with ML
    const releaseEffect = {
      gapScoreDelta: +1.5,              // gap score slightly worsens
      gradeForecastDelta: -0.05,         // CGPA forecast drops ~0.05
    };

    task.status = 'released';
    task.releaseEffect = releaseEffect;
    await task.save();

    await Commitment.findOneAndUpdate(
      { taskId: task._id },
      { $set: { status: 'released' } }
    );

    res.json({
      data: {
        task,
        projectedEffect: releaseEffect,
        message: 'Noted. Here is the projected impact on your Gap Score and grade forecast.',
      },
      error: null,
    });
  } catch (err) { next(err); }
});

// ─── Reschedule task ──────────────────────────────────────────────────────────

router.post('/tasks/:id/reschedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { newScheduledAt } = req.body as { newScheduledAt: string };
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, studentId: req.user!.studentId },
      { $set: { scheduledAt: new Date(newScheduledAt), status: 'rescheduled' } },
      { new: true }
    );
    if (!task) { res.status(404).json({ data: null, error: 'Task not found.' }); return; }

    await Commitment.findOneAndUpdate({ taskId: task._id }, { $set: { status: 'rescheduled' } });

    res.json({ data: task, error: null });
  } catch (err) { next(err); }
});

// ─── Daily flight plan ────────────────────────────────────────────────────────

router.get('/planner/daily', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dateStr = (req.query.date as string) ?? new Date().toISOString().split('T')[0];
    const day = new Date(dateStr);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);

    const tasks = await Task.find({
      studentId: req.user!.studentId,
      scheduledAt: { $gte: day, $lt: next },
      status: 'pending',
    }).sort({ priorityScore: -1 }).lean();

    res.json({ data: { date: dateStr, tasks }, error: null });
  } catch (err) { next(err); }
});

// ─── Workload heatmap ─────────────────────────────────────────────────────────

router.get('/planner/heatmap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Return task count and estimated hours per day for next 4 weeks
    const start = new Date();
    const end = new Date(start.getTime() + 28 * 86400000);

    const tasks = await Task.find({
      studentId: req.user!.studentId,
      scheduledAt: { $gte: start, $lt: end },
    }).lean();

    const heatmap: Record<string, { count: number; estimatedHours: number }> = {};
    for (const task of tasks) {
      const key = task.scheduledAt.toISOString().split('T')[0];
      if (!heatmap[key]) heatmap[key] = { count: 0, estimatedHours: 0 };
      heatmap[key].count++;
      heatmap[key].estimatedHours += task.estimatedMinutes / 60;
    }

    res.json({ data: heatmap, error: null });
  } catch (err) { next(err); }
});

// ─── Start focus session ──────────────────────────────────────────────────────

router.post('/focus', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId, technique } = req.body as { taskId: string; technique?: 'pomodoro' | 'flow' };
    const task = await Task.findOne({ _id: taskId, studentId: req.user!.studentId });
    if (!task) { res.status(404).json({ data: null, error: 'Task not found.' }); return; }

    const session = await FocusSession.create({
      studentId: req.user!.studentId,
      taskId,
      technique: technique ?? 'pomodoro',
    });

    res.status(201).json({ data: session, error: null });
  } catch (err) { next(err); }
});

// ─── End focus session ────────────────────────────────────────────────────────

router.patch('/focus/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { retrievalPracticeCompleted, interrupted } = req.body as {
      retrievalPracticeCompleted?: boolean;
      interrupted?: boolean;
    };

    const session = await FocusSession.findOne({ _id: req.params.id, studentId: req.user!.studentId });
    if (!session) { res.status(404).json({ data: null, error: 'Session not found.' }); return; }

    const endedAt = new Date();
    const durationMinutes = Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000);

    // Anti-gaming: XP only awarded for completed, focused sessions with retrieval practice
    const wasComplete = !interrupted && durationMinutes >= 20;
    const petXpAwarded = wasComplete && retrievalPracticeCompleted ? durationMinutes : 0;

    session.endedAt = endedAt;
    session.durationMinutes = durationMinutes;
    session.interrupted = interrupted ?? false;
    session.retrievalPracticeCompleted = retrievalPracticeCompleted ?? false;
    session.petXpAwarded = petXpAwarded;
    await session.save();

    res.json({ data: session, error: null });
  } catch (err) { next(err); }
});

export default router;
