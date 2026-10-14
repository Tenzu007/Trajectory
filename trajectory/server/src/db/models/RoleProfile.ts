import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRoleProfile extends Document {
  name: string;
  description: string;
  skillMap: Array<{
    name: string;
    tier: 'foundation' | 'core' | 'differentiator';
    prerequisites: string[];
  }>;
}

const RoleSkillSchema = new Schema(
  {
    name: { type: String, required: true },
    tier: { type: String, enum: ['foundation', 'core', 'differentiator'], required: true },
    prerequisites: { type: [String], default: [] },
  },
  { _id: false }
);

const RoleProfileSchema = new Schema<IRoleProfile>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    skillMap: { type: [RoleSkillSchema], default: [] },
  },
  { timestamps: true }
);

export const RoleProfile = mongoose.model<IRoleProfile>('RoleProfile', RoleProfileSchema);
