import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { Skill } from '../../db/models/Skill.js';
import { RoleProfile } from '../../db/models/RoleProfile.js';

const router = Router();
router.use(requireAuth);

// ─── List Role Profiles ───────────────────────────────────────────────────────

router.get('/role-profiles', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roles = await RoleProfile.find().sort({ name: 1 });
    res.json({ data: roles, error: null });
  } catch (err) {
    next(err);
  }
});

// ─── List Student Skills ──────────────────────────────────────────────────────

router.get('/skills', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.studentId;
    const skills = await Skill.find({ studentId }).sort({ tier: 1, name: 1 });
    res.json({ data: skills, error: null });
  } catch (err) {
    next(err);
  }
});

// ─── Create Skill ─────────────────────────────────────────────────────────────

const CreateSkillSchema = z.object({
  roleProfileId: z.string().optional(),
  name: z.string().min(1),
  tier: z.enum(['foundation', 'core', 'differentiator']),
  coveredByCurriculum: z.boolean().default(false),
  masteryLevel: z.number().min(0).max(1).default(0),
  proofOfWork: z
    .object({
      type: z.enum(['project', 'writeup', 'competition', 'contribution']),
      url: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

router.post(
  '/skills',
  validate(CreateSkillSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user!.studentId;
      const skill = await Skill.create({
        studentId,
        ...req.body,
      });
      res.status(201).json({ data: skill, error: null });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Update Skill / Proof-of-Work ─────────────────────────────────────────────

router.patch('/skills/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.studentId;
    const updated = await Skill.findOneAndUpdate(
      { _id: req.params.id, studentId },
      { $set: req.body },
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ data: null, error: 'Skill not found.' });
      return;
    }
    res.json({ data: updated, error: null });
  } catch (err) {
    next(err);
  }
});

// ─── Delete Skill ─────────────────────────────────────────────────────────────

router.delete('/skills/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = req.user!.studentId;
    const deleted = await Skill.findOneAndDelete({ _id: req.params.id, studentId });
    if (!deleted) {
      res.status(404).json({ data: null, error: 'Skill not found.' });
      return;
    }
    res.json({ data: { success: true }, error: null });
  } catch (err) {
    next(err);
  }
});

// ─── Import Skills from Role Profile ──────────────────────────────────────────

router.post(
  '/skills/import-role/:roleProfileId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentId = req.user!.studentId;
      const role = await RoleProfile.findById(req.params.roleProfileId);
      if (!role) {
        res.status(404).json({ data: null, error: 'Role profile not found.' });
        return;
      }

      // Check existing skills to avoid duplicates
      const existing = await Skill.find({ studentId }).select('name');
      const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));

      const skillsToCreate = role.skillMap
        .filter((sm) => !existingNames.has(sm.name.toLowerCase()))
        .map((sm) => ({
          studentId,
          roleProfileId: role._id,
          name: sm.name,
          tier: sm.tier,
          coveredByCurriculum: false,
          masteryLevel: 0,
        }));

      if (skillsToCreate.length > 0) {
        await Skill.insertMany(skillsToCreate);
      }

      const allSkills = await Skill.find({ studentId }).sort({ tier: 1 });
      res.status(201).json({ data: allSkills, error: null });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
