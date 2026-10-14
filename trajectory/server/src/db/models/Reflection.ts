import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReflection extends Document {
  studentId: Types.ObjectId;
  weekStartDate: Date;
  entropyAudit: {
    plannedHours: number;
    actualHours: number;
    bySubject: Array<{ courseId: Types.ObjectId; planned: number; actual: number }>;
  };
  outcomeLink: Array<{
    courseId: Types.ObjectId;
    studyHours: number;
    scoreMovement: number;
    flaggedAsMethodProblem: boolean;
  }>;
  confidenceVsScore: Array<{ topic: string; predicted: number; actual: number }>;
  blockers: Array<{ courseId: Types.ObjectId; frustration: string; controlAction: string }>;
  adjustment: string;
  completedAt?: Date;
}

const ReflectionSchema = new Schema<IReflection>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    weekStartDate: { type: Date, required: true },
    entropyAudit: {
      plannedHours: { type: Number, default: 0 },
      actualHours: { type: Number, default: 0 },
      bySubject: [{ courseId: Schema.Types.ObjectId, planned: Number, actual: Number, _id: false }],
    },
    outcomeLink: [{
      courseId: Schema.Types.ObjectId,
      studyHours: Number,
      scoreMovement: Number,
      flaggedAsMethodProblem: { type: Boolean, default: false },
      _id: false,
    }],
    confidenceVsScore: [{ topic: String, predicted: Number, actual: Number, _id: false }],
    blockers: [{ courseId: Schema.Types.ObjectId, frustration: String, controlAction: String, _id: false }],
    adjustment: { type: String, default: '' },
    completedAt: Date,
  },
  { timestamps: true }
);

ReflectionSchema.index({ studentId: 1, weekStartDate: -1 }, { unique: true });

export const Reflection = mongoose.model<IReflection>('Reflection', ReflectionSchema);
