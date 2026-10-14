import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Course } from '../../db/models/Course.js';
import { AttendanceRecord } from '../../db/models/AttendanceRecord.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { bunkHeadroom, gradeNeeded } from '@trajectory/shared';
import { createError } from '../../middleware/errorHandler.js';

const router = Router();
router.use(requireAuth);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateCourseSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20),
  semester: z.number().int().min(1).max(8),
  credits: z.number().int().min(1),
  currentMarks: z.number().min(0).default(0),
  totalMarks: z.number().min(1).default(100),
  isBacklog: z.boolean().default(false),
  topics: z.array(z.object({ name: z.string() })).default([]),
  attendanceThreshold: z.number().min(0).max(1).default(0.75),
});

const LogAttendanceSchema = z.object({
  date: z.string().transform((v) => new Date(v)),
  status: z.enum(['present', 'absent', 'cancelled']),
  classType: z.enum(['lecture', 'lab', 'tutorial']),
});

const GradeNeededQuerySchema = z.object({
  targetPercent: z.string().transform(Number).pipe(z.number().min(0).max(100)),
});

// ─── List courses ─────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await Course.find({ studentId: req.user!.studentId }).lean();
    res.json({ data: courses, error: null });
  } catch (err) { next(err); }
});

// ─── Create course ────────────────────────────────────────────────────────────

router.post('/', validate(CreateCourseSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof CreateCourseSchema>;
    const course = await Course.create({
      ...body,
      studentId: req.user!.studentId,
      attendanceConfig: { threshold: body.attendanceThreshold },
      topics: body.topics.map((t) => ({ name: t.name, mastery: 0, syllabusCovered: false })),
    });
    res.status(201).json({ data: course, error: null });
  } catch (err) { next(err); }
});

// ─── Get course ───────────────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, studentId: req.user!.studentId });
    if (!course) { res.status(404).json({ data: null, error: 'Course not found.' }); return; }
    res.json({ data: course, error: null });
  } catch (err) { next(err); }
});

// ─── Update course ────────────────────────────────────────────────────────────

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, studentId: req.user!.studentId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!course) { res.status(404).json({ data: null, error: 'Course not found.' }); return; }
    res.json({ data: course, error: null });
  } catch (err) { next(err); }
});

// ─── Delete course ────────────────────────────────────────────────────────────

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await Course.findOneAndDelete({ _id: req.params.id, studentId: req.user!.studentId });
    if (!result) { res.status(404).json({ data: null, error: 'Course not found.' }); return; }
    res.json({ data: { deleted: true }, error: null });
  } catch (err) { next(err); }
});

// ─── Attendance summary (with bunk headroom) ──────────────────────────────────

router.get('/:id/attendance-summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, studentId: req.user!.studentId });
    if (!course) { res.status(404).json({ data: null, error: 'Course not found.' }); return; }

    const records = await AttendanceRecord.find({ courseId: course._id, studentId: req.user!.studentId }).lean();

    const attended = records.filter((r) => r.status === 'present').length;
    const cancelled = records.filter((r) => r.status === 'cancelled').length;
    const held = records.length - cancelled;

    // remaining: student provides as query param or defaults to 20
    const remaining = Number(req.query.remaining ?? 20);

    const headroom = bunkHeadroom({
      attended,
      held,
      remaining,
      threshold: course.attendanceConfig.threshold,
    });

    res.json({
      data: { attended, held, remaining, ...headroom },
      error: null,
    });
  } catch (err) { next(err); }
});

// ─── Log attendance ───────────────────────────────────────────────────────────

router.post('/:id/attendance', validate(LogAttendanceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, studentId: req.user!.studentId });
    if (!course) { res.status(404).json({ data: null, error: 'Course not found.' }); return; }

    const body = req.body as z.infer<typeof LogAttendanceSchema>;
    const record = await AttendanceRecord.create({
      studentId: req.user!.studentId,
      courseId: course._id,
      ...body,
    });

    res.status(201).json({ data: record, error: null });
  } catch (err) {
    // Duplicate attendance for same slot
    if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ data: null, error: 'Attendance already recorded for this slot.' });
      return;
    }
    next(err);
  }
});

// ─── Grade needed ─────────────────────────────────────────────────────────────

router.get('/:id/grade-needed', validate(GradeNeededQuerySchema, 'query'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, studentId: req.user!.studentId }).populate('assessments');
    if (!course) { res.status(404).json({ data: null, error: 'Course not found.' }); return; }

    const query = req.query as unknown as z.infer<typeof GradeNeededQuerySchema>;

    const remaining = (course.assessments as unknown as Array<{ status: string; name: string; maxMarks: number; weight: number }>)
      .filter((a) => a.status === 'pending')
      .map((a) => ({ name: a.name, maxMarks: a.maxMarks, weight: a.weight }));

    const result = gradeNeeded({
      currentMarks: course.currentMarks,
      totalSoFar: course.totalMarks,
      remainingAssessments: remaining,
      targetPercent: query.targetPercent,
      totalMax: course.totalMarks,
    });

    res.json({ data: result, error: null });
  } catch (err) { next(err); }
});

export default router;
