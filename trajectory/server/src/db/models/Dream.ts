import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDream extends Document {
  studentId: Types.ObjectId;
  rawText: string;
  compiledAt?: Date;
  status: 'draft' | 'compiled' | 'confirmed';
  targets: Types.ObjectId[];
  realityCheck?: {
    feasible: boolean;
    obstacles: Array<{ description: string; ifThenPlan: string }>;
    alternativeTargets: Array<{ description: string; cost: string }>;
  };
  premortem?: { scenario: string; obstacles: string[] };
  contractSharedAt?: Date;
}

const DreamSchema = new Schema<IDream>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    rawText: { type: String, required: true },
    compiledAt: Date,
    status: { type: String, enum: ['draft', 'compiled', 'confirmed'], default: 'draft' },
    targets: [{ type: Schema.Types.ObjectId, ref: 'Target' }],
    realityCheck: {
      feasible: Boolean,
      obstacles: [{ description: String, ifThenPlan: String, _id: false }],
      alternativeTargets: [{ description: String, cost: String, _id: false }],
    },
    premortem: {
      scenario: String,
      obstacles: [String],
    },
    contractSharedAt: Date,
  },
  { timestamps: true }
);

DreamSchema.index({ studentId: 1, createdAt: -1 });

export const Dream = mongoose.model<IDream>('Dream', DreamSchema);
