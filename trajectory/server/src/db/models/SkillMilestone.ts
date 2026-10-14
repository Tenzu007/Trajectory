import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISkillMilestone extends Document {
  studentId: Types.ObjectId;
  skillId: Types.ObjectId;
  description: string;
  deadline?: Date;
  scheduledTaskId?: Types.ObjectId;
  completedAt?: Date;
}

const SkillMilestoneSchema = new Schema<ISkillMilestone>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    skillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    description: { type: String, required: true },
    deadline: { type: Date },
    scheduledTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const SkillMilestone = mongoose.model<ISkillMilestone>(
  'SkillMilestone',
  SkillMilestoneSchema
);
