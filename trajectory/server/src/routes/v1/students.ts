import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Student } from '../../db/models/Student.js';
import { Course } from '../../db/models/Course.js';
import { Task } from '../../db/models/Task.js';
import { Dream } from '../../db/models/Dream.js';
import { Target } from '../../db/models/Target.js';
import { Exam } from '../../db/models/Exam.js';
import { Reflection } from '../../db/models/Reflection.js';
import { HealthCheckin } from '../../db/models/HealthCheckin.js';
import { AttendanceRecord } from '../../db/models/AttendanceRecord.js';
import { Commitment } from '../../db/models/Commitment.js';
import { FocusSession } from '../../db/models/FocusSession.js';
import { Backlog } from '../../db/models/Backlog.js';
import { Forecast } from '../../db/models/Forecast.js';
import { LadderTest } from '../../db/models/LadderTest.js';
import { requireAuth, scopeToStudent } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  bunkHeadroom,
  gapScore,
  UNIVERSITY_PRESETS,
  getUniversityPreset,
  momentum,
  entropy,
  computePhysicsTelemetry,
} from '@trajectory/shared';
import { simulate } from '@trajectory/shared';


const router = Router();

// Mentor / Parent public read-only route (strictly filtered by student's sharedFields)
router.get('/shared-view/:studentId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      res.status(404).json({ data: null, error: 'Student not found.' });
      return;
    }

    const permitted = student.sharedFields || [];
    const sharedData: Record<string, unknown> = {
      name: student.name,
      onboardingCompleted: student.onboardingCompleted,
      allowedFields: permitted,
    };

    if (permitted.includes('cgpa_target')) {
      const forecast = await Forecast.findOne({ studentId: student._id }).sort({ createdAt: -1 });
      sharedData.cgpaForecast = forecast?.cgpaRange || { p10: 7.2, p50: 8.1, p90: 8.8 };
    }

    if (permitted.includes('attendance_status')) {
      const courses = await Course.find({ studentId: student._id }).select('name code isBacklog currentMarks');
      sharedData.enrolledCourses = courses;
    }

    if (permitted.includes('flight_plan_progress')) {
      const tasks = await Task.find({ studentId: student._id });
      const completed = tasks.filter((t) => t.status === 'done').length;
      sharedData.flightPlanSummary = {
        totalTasks: tasks.length,
        completedTasks: completed,
        completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 100,
      };
    }

    res.json({ data: sharedData, error: null });
  } catch (err) {
    next(err);
  }
});

// Public route: University Presets list
router.get('/university-presets', (_req: Request, res: Response) => {
  res.json({ data: UNIVERSITY_PRESETS, error: null });
});

// All student management routes below require auth + scope check
router.use(requireAuth);


const UpdateConfigSchema = z.object({
  attendanceThreshold: z.number().min(0).max(1).optional(),
  gradingScale: z.object({ max: z.number() }).optional(),
  creditRules: z.object({ passMark: z.number() }).optional(),
  gradeSchema: z.array(z.object({
    grade: z.string(),
    minPercent: z.number(),
    points: z.number(),
  })).optional(),
});

const OnboardingSchema = z.object({
  course: z.string().min(1),
  semester: z.number().int().min(1).max(8),
  subjects: z.array(z.object({
    name: z.string(),
    code: z.string(),
    credits: z.number(),
    currentMarks: z.number(),
    totalMarks: z.number(),
    isBacklog: z.boolean().default(false),
  })),
  sleepSchedule: z.object({ bedtime: z.string(), wakeup: z.string() }),
  preferredFocusLength: z.number().int().min(10).max(120),
  weeklyFreeHours: z.number().min(0).max(168),
  targetRole: z.string(),
});

// ─── Complete onboarding ──────────────────────────────────────────────────────

router.patch('/:studentId/onboarding', scopeToStudent, validate(OnboardingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof OnboardingSchema>;
    const studentId = req.user!.studentId;

    // Create courses from onboarding subjects
    const courses = await Course.insertMany(
      body.subjects.map((s) => ({
        studentId,
        name: s.name,
        code: s.code,
        semester: body.semester,
        credits: s.credits,
        currentMarks: s.currentMarks,
        totalMarks: s.totalMarks,
        isBacklog: s.isBacklog,
      }))
    );

    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          onboardingCompleted: true,
          'priors.preferredFocusLength': body.preferredFocusLength,
          'priors.weeklyFreeHours': body.weeklyFreeHours,
        },
      },
      { new: true }
    );

    res.json({ data: { student, courses }, error: null });
  } catch (err) { next(err); }
});

// ─── Update config ────────────────────────────────────────────────────────────

router.patch('/:studentId/config', scopeToStudent, validate(UpdateConfigSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof UpdateConfigSchema>;
    const updates: Record<string, unknown> = {};
    if (body.attendanceThreshold !== undefined) updates['config.attendanceThreshold'] = body.attendanceThreshold;
    if (body.gradingScale) updates['config.gradingScale'] = body.gradingScale;
    if (body.creditRules) updates['config.creditRules'] = body.creditRules;
    if (body.gradeSchema) updates['config.gradeSchema'] = body.gradeSchema;

    const student = await Student.findByIdAndUpdate(req.user!.studentId, { $set: updates }, { new: true });
    res.json({ data: student, error: null });
  } catch (err) { next(err); }
});

// ─── Apply University Preset ──────────────────────────────────────────────────

const ApplyPresetSchema = z.object({
  presetId: z.string().min(1),
});

router.patch('/:studentId/university-preset', scopeToStudent, validate(ApplyPresetSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { presetId } = req.body as z.infer<typeof ApplyPresetSchema>;
    const preset = UNIVERSITY_PRESETS.find((p) => p.id === presetId);
    if (!preset) {
      res.status(400).json({ data: null, error: `University preset '${presetId}' not found.` });
      return;
    }

    const student = await Student.findByIdAndUpdate(
      req.user!.studentId,
      {
        $set: {
          universityPreset: preset.id,
          'config.attendanceThreshold': preset.attendanceThreshold,
          'config.gradingScale': preset.gradingScale,
          'config.creditRules': preset.creditRules,
          'config.gradeSchema': preset.gradeSchema,
        },
      },
      { new: true }
    );

    res.json({ data: student, error: null });
  } catch (err) { next(err); }
});

// ─── Flight Telemetry Report ──────────────────────────────────────────────────

router.get('/:studentId/flight-report', scopeToStudent, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sid = req.user!.studentId;
    const [student, courses, backlogs, tasks, ladderTests, forecast, target] = await Promise.all([
      Student.findById(sid),
      Course.find({ studentId: sid }),
      Backlog.find({ studentId: sid }),
      Task.find({ studentId: sid }).sort({ scheduledAt: 1 }),
      LadderTest.find({ studentId: sid }),
      Forecast.findOne({ studentId: sid }).sort({ createdAt: -1 }),
      Target.findOne({ studentId: sid, type: 'role' }),
    ]);

    if (!student) {
      res.status(404).json({ data: null, error: 'Student not found.' });
      return;
    }

    const totalCredits = courses.reduce((sum: number, c: any) => sum + (c.credits || 0), 0);
    const backlogCredits = backlogs.reduce((sum: number, b: any) => sum + (b.credits || 0), 0);
    const threshold = student.config?.attendanceThreshold ?? 0.75;

    let totalAttendancePct = 0;
    let atRiskCoursesCount = 0;

    const activeCoursesReport = courses.map((c: any) => {
      const held = 40;
      const attendedRatio = c.totalMarks > 0 ? Math.min(1, Math.max(0.4, c.currentMarks / c.totalMarks)) : 0.85;
      const attended = Math.round(held * attendedRatio);
      const remaining = 20;
      const headroom = bunkHeadroom({ attended, held, remaining, threshold });

      totalAttendancePct += headroom.currentPct;
      if (headroom.currentPct < threshold * 100 || headroom.alreadyBelow) {
        atRiskCoursesCount++;
      }

      return {
        id: c._id.toString(),
        code: c.code,
        name: c.name,
        credits: c.credits,
        currentMarks: c.currentMarks,
        totalMarks: c.totalMarks,
        attendancePct: Math.round(headroom.currentPct),
        canMissClasses: headroom.canMiss,
        isBacklog: c.isBacklog,
      };
    });

    const avgAttendance = courses.length > 0 ? Math.round(totalAttendancePct / courses.length) : 85;
    const attendanceRiskFraction = courses.length > 0 ? atRiskCoursesCount / courses.length : 0;

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const completedTasks = tasks.filter((t: any) => t.status === 'done');
    const recentCompleted = completedTasks.filter((t: any) => t.completedAt && new Date(t.completedAt) >= fourteenDaysAgo);
    const weeklyVelocity = Math.max(0.5, Math.round((recentCompleted.length > 0 ? (recentCompleted.length / 2) : 2.5) * 10) / 10);

    const rescheduled = tasks.filter((t: any) => t.status === 'rescheduled');
    const slipRate = tasks.length > 0 ? rescheduled.length / tasks.length : 0.1;

    const physics = computePhysicsTelemetry({
      credits: totalCredits || 20,
      velocity: weeklyVelocity,
      momentumTrend: recentCompleted.length >= 4 ? 'rising' : 'stable',
      backlogCount: backlogs.length,
      attendanceRiskFraction,
      taskSlipRate: slipRate,
      plannedHours: 20,
      actualHours: 18,
    });

    const completedTests = ladderTests.filter((lt: any) => !!lt.completedDate).length;
    const upcomingTests = ladderTests.filter((lt: any) => !lt.completedDate).length;

    const upcomingTasks = tasks
      .filter((t: any) => t.status === 'pending')
      .slice(0, 7)
      .map((t: any) => ({
        id: t._id.toString(),
        title: t.title,
        type: t.type,
        scheduledAt: t.scheduledAt ? new Date(t.scheduledAt).toISOString() : new Date().toISOString(),
        priorityScore: t.priorityScore,
        twoMinuteLaunch: t.twoMinuteLaunch || 'Open the syllabus and write the first heading.',
      }));

    const reportData = {
      student: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        targetRole: target?.description || 'Software Engineer (Product Track)',
        universityPreset: student.universityPreset || 'autonomous_ugc',
      },
      generatedAt: new Date().toISOString(),
      academicTelemetry: {
        totalCredits,
        enrolledCoursesCount: courses.length,
        backlogCount: backlogs.length,
        backlogCredits,
        attendanceHealth: {
          averageAttendancePct: avgAttendance,
          coursesAtRiskCount: atRiskCoursesCount,
        },
        cgpaForecast: forecast?.cgpaRange || {
          p10: 7.4,
          p50: 8.2,
          p90: 8.9,
        },
      },
      physicsTelemetry: physics,
      activeCourses: activeCoursesReport,
      ladderTestsSummary: {
        total: ladderTests.length,
        completed: completedTests,
        upcoming: upcomingTests,
      },
      upcomingFlightPath: upcomingTasks,
    };

    res.json({ data: reportData, error: null });
  } catch (err) { next(err); }
});

// ─── Export all student data ──────────────────────────────────────────────────


router.get('/:studentId/export', scopeToStudent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sid = req.user!.studentId;
    const [student, courses, dreams, targets, exams, tasks, reflections, checkins, attendance, commitments, sessions, backlogs] =
      await Promise.all([
        Student.findById(sid),
        Course.find({ studentId: sid }),
        Dream.find({ studentId: sid }),
        Target.find({ studentId: sid }),
        Exam.find({ studentId: sid }),
        Task.find({ studentId: sid }),
        Reflection.find({ studentId: sid }),
        HealthCheckin.find({ studentId: sid }),
        AttendanceRecord.find({ studentId: sid }),
        Commitment.find({ studentId: sid }),
        FocusSession.find({ studentId: sid }),
        Backlog.find({ studentId: sid }),
      ]);

    res.setHeader('Content-Disposition', 'attachment; filename="trajectory-export.json"');
    res.json({ data: { student, courses, dreams, targets, exams, tasks, reflections, checkins, attendance, commitments, sessions, backlogs }, error: null });
  } catch (err) { next(err); }
});

// ─── Delete account (cascade) ─────────────────────────────────────────────────

router.delete('/:studentId', scopeToStudent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sid = req.user!.studentId;
    await Promise.all([
      Course.deleteMany({ studentId: sid }),
      Dream.deleteMany({ studentId: sid }),
      Target.deleteMany({ studentId: sid }),
      Exam.deleteMany({ studentId: sid }),
      Task.deleteMany({ studentId: sid }),
      Reflection.deleteMany({ studentId: sid }),
      HealthCheckin.deleteMany({ studentId: sid }),
      AttendanceRecord.deleteMany({ studentId: sid }),
      Commitment.deleteMany({ studentId: sid }),
      FocusSession.deleteMany({ studentId: sid }),
      Backlog.deleteMany({ studentId: sid }),
      Forecast.deleteMany({ studentId: sid }),
    ]);
    await Student.findByIdAndDelete(sid);

    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    res.json({ data: { deleted: true }, error: null });
  } catch (err) { next(err); }
});

// ─── Calculation proxy endpoints ──────────────────────────────────────────────

const BunkCalcSchema = z.object({
  attended: z.number().int().min(0),
  held: z.number().int().min(0),
  remaining: z.number().int().min(0),
  threshold: z.number().min(0).max(1).optional(),
});

router.post('/calc/bunk', validate(BunkCalcSchema), (req: Request, res: Response) => {
  const result = bunkHeadroom(req.body);
  res.json({ data: result, error: null });
});

const GapScoreCalcSchema = z.object({
  cgpaGap: z.number().min(0).max(10),
  backlogCount: z.number().int().min(0),
  attendanceRisk: z.number().min(0).max(1),
  skillGap: z.number().min(0).max(1),
});

router.post('/calc/gap-score', validate(GapScoreCalcSchema), (req: Request, res: Response) => {
  const result = gapScore(req.body);
  res.json({ data: result, error: null });
});

// ─── Mentor & Parent Privacy View ─────────────────────────────────────────────

router.patch('/:studentId/shared-fields', scopeToStudent, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sharedFields, mentorEmail, parentEmail } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.user!.studentId,
      {
        $set: {
          sharedFields: sharedFields || [],
          mentorEmail,
          parentEmail,
        },
      },
      { new: true }
    );
    res.json({ data: student, error: null });
  } catch (err) {
    next(err);
  }
});

export default router;
