import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReviewLog extends Document {
  studentId: Types.ObjectId;
  flashcardId: Types.ObjectId;
  reviewedAt: Date;
  rating: number; // 0 to 5
  intervalDays: number;
  easeFactor: number;
  nextDueAt: Date;
}

const ReviewLogSchema = new Schema<IReviewLog>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    flashcardId: { type: Schema.Types.ObjectId, ref: 'Flashcard', required: true, index: true },
    reviewedAt: { type: Date, default: () => new Date() },
    rating: { type: Number, required: true, min: 0, max: 5 },
    intervalDays: { type: Number, required: true },
    easeFactor: { type: Number, required: true },
    nextDueAt: { type: Date, required: true },
  },
  { timestamps: true }
);

ReviewLogSchema.index({ studentId: 1, reviewedAt: -1 });

export const ReviewLog = mongoose.model<IReviewLog>('ReviewLog', ReviewLogSchema);
