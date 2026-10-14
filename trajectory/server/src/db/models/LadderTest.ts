import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILadderTest extends Document {
  studentId: Types.ObjectId;
  examId: Types.ObjectId;
  tier: 1 | 2 | 3;
  scheduledDate: Date;
  completedDate?: Date;
  topicsCovered: string[];
  openNotes: boolean;
  scoredMarks?: number;
  maxMarks?: number;
  compressed: boolean;
  compressedReason?: string;
  attemptId?: Types.ObjectId;
}

const LadderTestSchema = new Schema<ILadderTest>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    tier: { type: Number, enum: [1, 2, 3], required: true },
    scheduledDate: { type: Date, required: true },
    completedDate: Date,
    topicsCovered: { type: [String], default: [] },
    openNotes: { type: Boolean, default: false },
    scoredMarks: Number,
    maxMarks: Number,
    compressed: { type: Boolean, default: false },
    compressedReason: String,
    attemptId: { type: Schema.Types.ObjectId, ref: 'TestAttempt' },
  },
  { timestamps: true }
);

LadderTestSchema.index({ studentId: 1, examId: 1 });

export const LadderTest = mongoose.model<ILadderTest>('LadderTest', LadderTestSchema);
