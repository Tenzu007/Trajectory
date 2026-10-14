import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Reflection } from '../../db/models/Reflection.js';
import { HealthCheckin } from '../../db/models/HealthCheckin.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { entropy } from '@trajectory/shared';

const router = Router();
router.use(requireAuth);

// ─── Reflections ──────────────────────────────────────────────────────────────

const CreateReflectionSchema = z.object({
  weekStartDate: z.string().transform((v) => new Date(v)),
  entropyAudit: z.object({
    plannedHours: z.number().min(0),
    actualHours: z.number().min(0),
    bySubject: z.array(z.object({
      courseId: z.string(),
      planned: z.number(),
      actual: z.number(),
    })).default([]),
  }),
  outcomeLink: z.array(z.object({
    courseId: z.string(),
    studyHours: z.number(),
    scoreMovement: z.number(),
    flaggedAsMethodProblem: z.boolean().default(false),
  })).default([]),
  confidenceVsScore: z.array(z.object({
    topic: z.string(),
    predicted: z.number(),
    actual: z.number(),
  })).default([]),
  blockers: z.array(z.object({
    courseId: z.string(),
    frustration: z.string().min(10, 'A 10+ character honest answer is required for each blocker.'),
    controlAction: z.string().min(5),
  })).default([]),
  adjustment: z.string().default(''),
});

router.post('/reflections', validate(CreateReflectionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof CreateReflectionSchema>;

    const entropyResult = entropy(body.entropyAudit.plannedHours, body.entropyAudit.actualHours);

    const reflection = await Reflection.create({
      studentId: req.user!.studentId,
      ...body,
      completedAt: new Date(),
    });

    res.status(201).json({ data: { reflection, entropy: entropyResult }, error: null });
  } catch (err) { next(err); }
});

router.get('/reflections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { week } = req.query;
    const filter: Record<string, unknown> = { studentId: req.user!.studentId };
    if (week) {
      const weekStart = new Date(week as string);
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
      filter.weekStartDate = { $gte: weekStart, $lt: weekEnd };
    }
    const reflections = await Reflection.find(filter).sort({ weekStartDate: -1 }).limit(12).lean();
    res.json({ data: reflections, error: null });
  } catch (err) { next(err); }
});

// ─── Health Check-ins ─────────────────────────────────────────────────────────

const HealthCheckinSchema = z.object({
  date: z.string().transform((v) => new Date(v)),
  sleepHours: z.number().min(0).max(24),
  exercised: z.boolean().default(false),
  mood: z.number().int().min(1).max(5) as z.ZodType<1 | 2 | 3 | 4 | 5>,
});

router.post('/health-checkins', validate(HealthCheckinSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof HealthCheckinSchema>;
    const studentId = req.user!.studentId;

    // Wellbeing flag: check last 5 days for repeated low mood (<=2)
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);
    const recentCheckins = await HealthCheckin.find({
      studentId,
      date: { $gte: fiveDaysAgo },
    }).lean();

    const lowMoodCount = recentCheckins.filter((c) => c.mood <= 2).length;
    const flaggedForWellbeing = lowMoodCount >= 3 || (body.mood <= 2 && lowMoodCount >= 2);

    const checkin = await HealthCheckin.create({ studentId, ...body, flaggedForWellbeing });

    const wellbeingMessage = flaggedForWellbeing
      ? 'We notice you\'ve been having a tough time lately. Remember: talking to a counsellor or a trusted person can help. You\'re not alone. iCall: 9152987821'
      : null;

    res.status(201).json({ data: checkin, error: null, wellbeingMessage });
  } catch (err) { next(err); }
});

router.get('/health-checkins', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const checkins = await HealthCheckin.find({ studentId: req.user!.studentId })
      .sort({ date: -1 })
      .limit(30)
      .lean();
    res.json({ data: checkins, error: null });
  } catch (err) { next(err); }
});

export default router;
