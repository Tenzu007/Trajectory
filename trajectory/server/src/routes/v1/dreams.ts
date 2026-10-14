import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Dream } from '../../db/models/Dream.js';
import { Target } from '../../db/models/Target.js';
import { Course } from '../../db/models/Course.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { llmComplete } from '../../adapters/llm.js';
import { gapScore, gradeNeeded } from '@trajectory/shared';

const router = Router();
router.use(requireAuth);

const CreateDreamSchema = z.object({
  rawText: z.string().min(10).max(2000),
});

const ConfirmTargetsSchema = z.object({
  targets: z.array(z.object({
    type: z.enum(['cgpa', 'subject_grade', 'skill', 'role', 'backlog_clear', 'other']),
    description: z.string(),
    measurableValue: z.union([z.number(), z.string()]),
    deadline: z.string().transform((v) => new Date(v)),
    currentValue: z.union([z.number(), z.string()]),
  })),
});

const PremortemSchema = z.object({
  scenario: z.string().min(10),
  obstacles: z.array(z.string().min(1)).min(1),
});

// ─── Create dream ─────────────────────────────────────────────────────────────

router.post('/', validate(CreateDreamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dream = await Dream.create({
      studentId: req.user!.studentId,
      rawText: req.body.rawText,
      status: 'draft',
    });
    res.status(201).json({ data: dream, error: null });
  } catch (err) { next(err); }
});

// ─── Compile dream (LLM) ──────────────────────────────────────────────────────

router.post('/:id/compile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dream = await Dream.findOne({ _id: req.params.id, studentId: req.user!.studentId });
    if (!dream) { res.status(404).json({ data: null, error: 'Dream not found.' }); return; }

    const systemPrompt = `You are a precise academic planning assistant. Extract measurable targets from a student's dream statement.
IMPORTANT: Always pair each dream with realistic obstacles.
Never promise guaranteed outcomes — say "raises your odds" not "guarantees".
Respond ONLY with valid JSON in this exact structure:
{
  "targets": [
    { "type": "cgpa|subject_grade|skill|role|backlog_clear|other", "description": "...", "measurableValue": <number or string>, "currentValue": <number or string>, "deadline": "YYYY-MM-DD" }
  ],
  "obstacles": [
    { "description": "...", "ifThenPlan": "If ... then I will ..." }
  ]
}`;

    const prompt = `Student dream: "${dream.rawText}"\n\nExtract measurable targets and realistic obstacles.`;

    let compiled: {
      targets: Array<{ type: string; description: string; measurableValue: number | string; currentValue: number | string; deadline: string }>;
      obstacles: Array<{ description: string; ifThenPlan: string }>;
    };

    try {
      const response = await llmComplete(prompt, systemPrompt);
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in LLM response');
      compiled = JSON.parse(jsonMatch[0]);
    } catch (llmErr) {
      // Fallback: return a structured placeholder for manual edit
      compiled = {
        targets: [{ type: 'cgpa', description: 'Improve CGPA', measurableValue: 8.0, currentValue: 6.5, deadline: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0] }],
        obstacles: [{ description: 'Time management', ifThenPlan: 'If I miss a session, I will reschedule within 24 hours.' }],
      };
    }

    dream.compiledAt = new Date();
    dream.status = 'compiled';
    dream.realityCheck = {
      feasible: true, // Will be computed on /reality-check
      obstacles: compiled.obstacles,
      alternativeTargets: [],
    };

    await dream.save();

    res.json({ data: { dream, suggestedTargets: compiled.targets }, error: null });
  } catch (err) { next(err); }
});

// ─── Confirm dream (student edits and confirms) ───────────────────────────────

router.patch('/:id', validate(ConfirmTargetsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof ConfirmTargetsSchema>;
    const dream = await Dream.findOne({ _id: req.params.id, studentId: req.user!.studentId });
    if (!dream) { res.status(404).json({ data: null, error: 'Dream not found.' }); return; }

    // Delete old targets, create new ones
    await Target.deleteMany({ dreamId: dream._id });
    const targets = await Target.insertMany(
      body.targets.map((t) => ({ ...t, studentId: req.user!.studentId, dreamId: dream._id, gapScore: 0 }))
    );

    dream.targets = targets.map((t) => t._id);
    dream.status = 'confirmed';
    await dream.save();

    res.json({ data: { dream, targets }, error: null });
  } catch (err) { next(err); }
});

// ─── Reality check ────────────────────────────────────────────────────────────

router.get('/:id/reality-check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dream = await Dream.findOne({ _id: req.params.id, studentId: req.user!.studentId });
    if (!dream) { res.status(404).json({ data: null, error: 'Dream not found.' }); return; }

    const targets = await Target.find({ dreamId: dream._id, studentId: req.user!.studentId });
    const courses = await Course.find({ studentId: req.user!.studentId });

    // Compute gap score from targets
    const cgpaTarget = targets.find((t) => t.type === 'cgpa');
    const cgpaGap = cgpaTarget
      ? Math.max(0, Number(cgpaTarget.measurableValue) - Number(cgpaTarget.currentValue))
      : 0;

    const gap = gapScore({
      cgpaGap,
      backlogCount: courses.filter((c) => c.isBacklog).length,
      attendanceRisk: 0.1,
      skillGap: 0.3,
    });

    // Feasibility check
    const feasible = cgpaGap <= 2; // Simplified heuristic; real check in gradeNeeded per course

    if (!dream.realityCheck) {
      dream.realityCheck = { feasible, obstacles: [], alternativeTargets: [] };
    }
    dream.realityCheck.feasible = feasible;
    await dream.save();

    res.json({
      data: {
        feasible,
        gapScore: gap,
        warningMessage: !feasible ? 'This target may be very challenging. Review the alternatives below.' : null,
        sleepWarning: null, // will be computed if plan requires all-nighters
      },
      error: null,
    });
  } catch (err) { next(err); }
});

// ─── Premortem ────────────────────────────────────────────────────────────────

router.post('/:id/premortem', validate(PremortemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof PremortemSchema>;
    const dream = await Dream.findOneAndUpdate(
      { _id: req.params.id, studentId: req.user!.studentId },
      { $set: { premortem: body } },
      { new: true }
    );
    if (!dream) { res.status(404).json({ data: null, error: 'Dream not found.' }); return; }
    res.json({ data: dream, error: null });
  } catch (err) { next(err); }
});

// ─── List dreams ──────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dreams = await Dream.find({ studentId: req.user!.studentId }).sort({ createdAt: -1 }).lean();
    res.json({ data: dreams, error: null });
  } catch (err) { next(err); }
});

export default router;
