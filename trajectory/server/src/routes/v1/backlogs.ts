import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { Backlog } from '../../db/models/Backlog.js';
import { Course } from '../../db/models/Course.js';
import { SupportMapEntry } from '../../db/models/SupportMapEntry.js';
import { rankBacklogs } from '@trajectory/shared';

const router = Router();
router.use(requireAuth);

// ─── List Backlogs ────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.studentId;
    const backlogs = await Backlog.find({ studentId }).populate('courseId');

    // Dynamically compute recovery values
    const rankInputs = backlogs.map((b) => {
      const suppDate = new Date(b.suppExamDate);
      const daysAway = Math.max(1, Math.ceil((suppDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const course = b.courseId as any;
      return {
        id: course?._id ? course._id.toString() : b._id.toString(),
        credits: b.credits || 4,
        effortHours: Math.max(1, (b.syllabusRemaining?.length || 3) * 6),
        blocksLaterCourses: (b.prerequisiteChain?.length || 0) > 0,
        suppExamDaysAway: daysAway,
      };
    });

    const ranked = rankBacklogs(rankInputs);

    // Merge ranked recoveryValue back to backlog response
    const enriched = backlogs.map((b) => {
      const match = ranked.find((r) => r.id === ((b.courseId as any)?._id?.toString() || b._id.toString()));
      return {
        ...b.toObject(),
        recoveryValue: match ? match.recoveryValue : b.recoveryValue,
        suppExamDaysAway: match ? match.suppExamDaysAway : 30,
      };
    }).sort((a, b) => (b.recoveryValue || 0) - (a.recoveryValue || 0));

    res.json({ data: enriched, error: null });
  } catch (err) {
    next(err);
  }
});

// ─── Create Backlog ───────────────────────────────────────────────────────────

const CreateBacklogSchema = z.object({
  courseId: z.string().min(1),
  suppExamDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  syllabusRemaining: z.array(z.string()).default([]),
  prerequisiteChain: z.array(z.string()).default([]),
  pastScore: z.number().default(0),
  credits: z.number().default(4),
  rootCause: z.enum(['foundations', 'technique', 'attendance', 'time_clash']).optional(),
  vectorBMinutes: z.object({
    default: z.number().default(90),
    minimum: z.number().default(45),
  }).default({ default: 90, minimum: 45 }),
});

router.post(
  '/',
  validate(CreateBacklogSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user!.studentId;
      const { courseId, suppExamDate, syllabusRemaining, prerequisiteChain, pastScore, credits, rootCause, vectorBMinutes } = req.body;

      // Verify course ownership
      const course = await Course.findOne({ _id: courseId, studentId });
      if (!course) {
        res.status(404).json({ data: null, error: 'Course not found or access denied.' });
        return;
      }

      // Mark course as backlog
      course.isBacklog = true;
      await course.save();

      const backlog = await Backlog.create({
        studentId,
        courseId,
        suppExamDate: new Date(suppExamDate),
        syllabusRemaining,
        prerequisiteChain,
        pastScore,
        credits,
        rootCause,
        vectorBMinutes,
      });

      // Auto-generate culturally respectful Support Map templates
      const professorTemplate = `Respected Professor, I am preparing for the upcoming supplementary exam in ${course.name}. I analyzed my previous performance and identified key areas where my conceptual foundations were weak. May I visit during your office hours this week for 10 minutes to verify if my revision roadmap covers the most critical topics? Thank you, ${req.user!.email}`;
      const seniorTemplate = `Hi! I saw you cleared ${course.name} with an excellent grade. I have a supplementary exam scheduled next month. Could you share which question patterns or reference materials were most representative of the actual exam paper? Really appreciate any guidance!`;

      await SupportMapEntry.create([
        {
          studentId,
          backlogId: backlog._id,
          personName: 'Course Instructor / Professor',
          role: 'professor',
          specificAsk: 'Syllabus focus review & priority question guidance',
          messageTemplate: professorTemplate,
          contacted: false,
        },
        {
          studentId,
          backlogId: backlog._id,
          personName: 'Senior / Top Scorer',
          role: 'senior',
          specificAsk: 'Previous year question papers & key derivation notes',
          messageTemplate: seniorTemplate,
          contacted: false,
        },
      ]);

      const populated = await Backlog.findById(backlog._id).populate('courseId');
      res.status(201).json({ data: populated, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Get Backlog Detail ───────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.studentId;
    const backlog = await Backlog.findOne({ _id: req.params.id, studentId }).populate('courseId');
    if (!backlog) {
      res.status(404).json({ data: null, error: 'Backlog not found.' });
      return;
    }
    res.json({ data: backlog, error: null });
  } catch (err) {
    next(err);
  }
});

// ─── Update Backlog ───────────────────────────────────────────────────────────

router.patch('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.studentId;
    const updated = await Backlog.findOneAndUpdate(
      { _id: req.params.id, studentId },
      { $set: req.body },
      { new: true }
    ).populate('courseId');

    if (!updated) {
      res.status(404).json({ data: null, error: 'Backlog not found.' });
      return;
    }
    res.json({ data: updated, error: null });
  } catch (err) {
    next(err);
  }
});

// ─── Root Cause Diagnostic ───────────────────────────────────────────────────

const RootCauseSchema = z.object({
  rootCause: z.enum(['foundations', 'technique', 'attendance', 'time_clash']),
  notes: z.string().optional(),
});

router.post(
  '/:id/root-cause',
  validate(RootCauseSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user!.studentId;
      const { rootCause } = req.body;

      const backlog = await Backlog.findOneAndUpdate(
        { _id: req.params.id, studentId },
        { $set: { rootCause } },
        { new: true }
      ).populate('courseId');

      if (!backlog) {
        res.status(404).json({ data: null, error: 'Backlog not found.' });
        return;
      }

      // Prescription recommendations based on root cause
      const recommendations: Record<string, string> = {
        foundations: 'Rebuild core prerequisites first. Spend 60% of study time on fundamental definitions & solved examples before attempting past papers.',
        technique: 'Shift from passive textbook reading to active retrieval practice (Ladder T1/T2 tests) and Feynman explanations.',
        attendance: 'Secure class lecture notes and professor problem sets immediately through your Support Map contacts.',
        time_clash: 'Enforce strict 90-minute morning Vector B protection blocks to decouple supp exam study from daily semester workload.',
      };

      res.json({
        data: {
          backlog,
          recommendation: recommendations[rootCause],
        },
        error: null,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Support Map Endpoints ────────────────────────────────────────────────────

router.get('/:id/support-map', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.studentId;
    const entries = await SupportMapEntry.find({ backlogId: req.params.id, studentId });
    res.json({ data: entries, error: null });
  } catch (err) {
    next(err);
  }
});

const AddSupportEntrySchema = z.object({
  personName: z.string().min(1),
  role: z.enum(['professor', 'ta', 'senior', 'peer', 'mentor']),
  specificAsk: z.string().min(1),
  messageTemplate: z.string().min(1),
  checkInDate: z.string().optional(),
});

router.post(
  '/:id/support-map',
  validate(AddSupportEntrySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user!.studentId;
      const entry = await SupportMapEntry.create({
        studentId,
        backlogId: req.params.id,
        ...req.body,
      });
      res.status(201).json({ data: entry, error: null });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/support-map/:entryId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user!.studentId;
      const entry = await SupportMapEntry.findOneAndUpdate(
        { _id: req.params.entryId, studentId },
        { $set: req.body },
        { new: true }
      );
      if (!entry) {
        res.status(404).json({ data: null, error: 'Support entry not found.' });
        return;
      }
      res.json({ data: entry, error: null });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
