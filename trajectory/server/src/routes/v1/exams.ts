import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Exam } from '../../db/models/Exam.js';
import { LadderTest } from '../../db/models/LadderTest.js';
import { TestAttempt } from '../../db/models/TestAttempt.js';
import { Course } from '../../db/models/Course.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { scheduleLadder } from '@trajectory/shared';

const router = Router();
router.use(requireAuth);

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateExamSchema = z.object({
  courseId: z.string().min(1),
  name: z.string().min(1),
  date: z.string().transform((v) => new Date(v)),
  syllabusTopics: z.array(z.string()).default([]),
  isBacklog: z.boolean().default(false),
});

const SubmitAttemptSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    correct: z.boolean(),
    errorType: z.enum(['concept_gap', 'careless', 'time_pressure']).optional(),
    topic: z.string(),
  })),
  timeTaken: z.number().int().min(1),
});

// ─── Create exam + auto-schedule ladder ──────────────────────────────────────

router.post('/', validate(CreateExamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof CreateExamSchema>;
    const studentId = req.user!.studentId;

    // Verify the course belongs to this student
    const course = await Course.findOne({ _id: body.courseId, studentId });
    if (!course) {
      res.status(404).json({ data: null, error: 'Course not found.' });
      return;
    }

    const exam = await Exam.create({ ...body, studentId });

    // Auto-schedule the 3-tier ladder
    const ladder = scheduleLadder({ examDate: body.date });

    const tierConfigs: Array<{
      tier: 1 | 2 | 3;
      scheduledDate: Date;
      openNotes: boolean;
      topicsCovered: string[];
    }> = [
      {
        tier: 1,
        scheduledDate: ladder.t1,
        openNotes: true,                                        // T1: diagnostic, open notes
        topicsCovered: body.syllabusTopics.slice(0, Math.ceil(body.syllabusTopics.length * 0.4)),
      },
      {
        tier: 2,
        scheduledDate: ladder.t2,
        openNotes: false,
        topicsCovered: body.syllabusTopics,                    // T2: targeted (all topics, timed)
      },
      {
        tier: 3,
        scheduledDate: ladder.t3,
        openNotes: false,
        topicsCovered: body.syllabusTopics,                    // T3: full mock, strict
      },
    ];

    const ladderTests = await LadderTest.insertMany(
      tierConfigs.map((t) => ({
        ...t,
        studentId,
        examId: exam._id,
        compressed: ladder.compressed,
        compressedReason: ladder.compressedReason,
      }))
    );

    exam.ladderTests = ladderTests.map((lt) => lt._id);
    await exam.save();

    res.status(201).json({
      data: { exam, ladderTests, ladderCompressed: ladder.compressed, compressedReason: ladder.compressedReason },
      error: null,
    });
  } catch (err) { next(err); }
});

// ─── List exams ───────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exams = await Exam.find({ studentId: req.user!.studentId })
      .sort({ date: 1 })
      .populate('ladderTests')
      .lean();
    res.json({ data: exams, error: null });
  } catch (err) { next(err); }
});

// ─── Get exam with ladder ─────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, studentId: req.user!.studentId })
      .populate('ladderTests');
    if (!exam) { res.status(404).json({ data: null, error: 'Exam not found.' }); return; }
    res.json({ data: exam, error: null });
  } catch (err) { next(err); }
});

// ─── Submit test attempt ──────────────────────────────────────────────────────

router.post('/ladder/:testId/attempt', validate(SubmitAttemptSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof SubmitAttemptSchema>;
    const studentId = req.user!.studentId;

    const ladderTest = await LadderTest.findOne({ _id: req.params.testId, studentId });
    if (!ladderTest) {
      res.status(404).json({ data: null, error: 'Ladder test not found.' });
      return;
    }

    // Build autopsy
    const conceptGaps = [...new Set(
      body.answers.filter((a) => !a.correct && a.errorType === 'concept_gap').map((a) => a.topic)
    )];
    const carelessMistakes = [...new Set(
      body.answers.filter((a) => !a.correct && a.errorType === 'careless').map((a) => a.topic)
    )];
    const timePressureItems = [...new Set(
      body.answers.filter((a) => !a.correct && a.errorType === 'time_pressure').map((a) => a.topic)
    )];

    const fixList = [
      ...conceptGaps.map((topic, i) => ({ item: topic, action: 'Re-study concept from scratch', priority: i + 1 })),
      ...carelessMistakes.map((topic, i) => ({ item: topic, action: 'Practice 5 similar problems slowly', priority: conceptGaps.length + i + 1 })),
      ...timePressureItems.map((topic, i) => ({ item: topic, action: 'Timed drills — aim for 80% speed', priority: conceptGaps.length + carelessMistakes.length + i + 1 })),
    ];

    const attempt = await TestAttempt.create({
      studentId,
      ladderTestId: ladderTest._id,
      answers: body.answers,
      timeTaken: body.timeTaken,
      autopsy: { conceptGaps, carelessMistakes, timePressureItems, fixList },
    });

    ladderTest.completedDate = new Date();
    ladderTest.attemptId = attempt._id;
    ladderTest.scoredMarks = body.answers.filter((a) => a.correct).length;
    ladderTest.maxMarks = body.answers.length;
    await ladderTest.save();

    res.status(201).json({ data: { attempt, autopsy: attempt.autopsy }, error: null });
  } catch (err) { next(err); }
});

// ─── Get autopsy ──────────────────────────────────────────────────────────────

router.get('/ladder/:testId/autopsy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ladderTest = await LadderTest.findOne({ _id: req.params.testId, studentId: req.user!.studentId });
    if (!ladderTest) { res.status(404).json({ data: null, error: 'Ladder test not found.' }); return; }
    if (!ladderTest.attemptId) { res.status(404).json({ data: null, error: 'No attempt yet.' }); return; }

    const attempt = await TestAttempt.findById(ladderTest.attemptId);
    res.json({ data: attempt?.autopsy ?? null, error: null });
  } catch (err) { next(err); }
});

export default router;
