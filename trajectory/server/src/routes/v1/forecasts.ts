import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { Course } from '../../db/models/Course.js';
import { Backlog } from '../../db/models/Backlog.js';
import { Forecast } from '../../db/models/Forecast.js';
import { simulate } from '@trajectory/shared';

const router = Router();
router.use(requireAuth);

router.post('/generate', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.studentId;
    const [courses, backlogs] = await Promise.all([
      Course.find({ studentId }),
      Backlog.find({ studentId }),
    ]);

    const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 4), 0);
    const completedCredits = courses
      .filter((c) => !c.isBacklog && (c.currentMarks || 0) >= 40)
      .reduce((sum, c) => sum + (c.credits || 4), 0);
    const remainingCredits = Math.max(1, totalCredits - completedCredits);

    const currentCgpa = courses.length > 0
      ? Math.round((courses.reduce((sum, c) => sum + ((c.currentMarks || 75) / 10), 0) / courses.length) * 100) / 100
      : 7.5;

    // Run seeded 1,000-run Monte Carlo simulation from @trajectory/shared
    const simResult = simulate(
      {
        remainingAssessments: [
          { weight: 0.4, maxMarks: 100, currentExpectedPct: Math.min(95, currentCgpa * 10), stdDevPct: 8 },
          { weight: 0.3, maxMarks: 100, currentExpectedPct: Math.min(95, currentCgpa * 10 - 4), stdDevPct: 10 },
          { weight: 0.3, maxMarks: 100, currentExpectedPct: Math.min(95, currentCgpa * 10 + 2), stdDevPct: 7 },
        ],
        currentCgpa,
        currentCreditsCompleted: completedCredits || 60,
        totalCredits: Math.max(totalCredits, (completedCredits || 60) + remainingCredits),
        seed: 42,
      },
      1000
    );

    const scenarios = [
      { action: 'Clear all pending backlogs on 1st attempt', cgpaDelta: +0.65 },
      { action: 'Maintain >85% attendance across all subjects', cgpaDelta: +0.35 },
      { action: 'Score ≥80% on high-credit core lab courses', cgpaDelta: +0.42 },
      { action: 'Drop 1 optional elective with high risk', cgpaDelta: +0.15 },
    ];

    const forecast = await Forecast.create({
      studentId,
      generatedAt: new Date(),
      cgpaRange: {
        p10: simResult.p10,
        p50: simResult.p50,
        p90: simResult.p90,
      },
      scenarios,
      simulationInputs: {
        remainingAssessments: [],
        currentPerf: [],
      },
      seedUsed: simResult.seedUsed ?? 42,
    });

    res.status(201).json({ data: forecast, error: null });
  } catch (err) {
    next(err);
  }
});

router.get('/latest', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.studentId;
    let forecast = await Forecast.findOne({ studentId }).sort({ createdAt: -1 });

    if (!forecast) {
      // Auto-generate initial forecast if none exists
      const simResult = simulate(
        {
          remainingAssessments: [
            { weight: 0.5, maxMarks: 100, currentExpectedPct: 74, stdDevPct: 8 },
            { weight: 0.5, maxMarks: 100, currentExpectedPct: 78, stdDevPct: 9 },
          ],
          currentCgpa: 7.4,
          currentCreditsCompleted: 80,
          totalCredits: 120,
          seed: 12345,
        },
        1000
      );

      forecast = await Forecast.create({
        studentId,
        generatedAt: new Date(),
        cgpaRange: {
          p10: simResult.p10,
          p50: simResult.p50,
          p90: simResult.p90,
        },
        scenarios: [
          { action: 'Clear all pending backlogs on 1st attempt', cgpaDelta: +0.65 },
          { action: 'Maintain >85% attendance across all subjects', cgpaDelta: +0.35 },
          { action: 'Score ≥80% on high-credit core lab courses', cgpaDelta: +0.42 },
        ],
        simulationInputs: {
          remainingAssessments: [],
          currentPerf: [],
        },
        seedUsed: simResult.seedUsed ?? 12345,
      });
    }

    res.json({ data: forecast, error: null });
  } catch (err) {
    next(err);
  }
});

export default router;
