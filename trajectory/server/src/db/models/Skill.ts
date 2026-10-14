import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISkill extends Document {
  studentId: Types.ObjectId;
  roleProfileId?: Types.ObjectId;
  name: string;
  tier: 'foundation' | 'core' | 'differentiator';
  coveredByCurriculum: boolean;
  masteryLevel: number; // 0 to 1
  proofOfWork?: {
    type: 'project' | 'writeup' | 'competition' | 'contribution';
    url?: string;
    description?: string;
  };
  unlocksSkills: Types.ObjectId[];
  milestones: Types.ObjectId[];
}

const SkillSchema = new Schema<ISkill>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    roleProfileId: { type: Schema.Types.ObjectId, ref: 'RoleProfile' },
    name: { type: String, required: true },
    tier: {
      type: String,
      enum: ['foundation', 'core', 'differentiator'],
      required: true,
    },
    coveredByCurriculum: { type: Boolean, default: false },
    masteryLevel: { type: Number, default: 0, min: 0, max: 1 },
    proofOfWork: {
      type: {
        type: String,
        enum: ['project', 'writeup', 'competition', 'contribution'],
      },
      url: String,
      description: String,
    },
    unlocksSkills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
    milestones: [{ type: Schema.Types.ObjectId, ref: 'SkillMilestone' }],
  },
  { timestamps: true }
);

SkillSchema.index({ studentId: 1, tier: 1 });

export const Skill = mongoose.model<ISkill>('Skill', SkillSchema);
