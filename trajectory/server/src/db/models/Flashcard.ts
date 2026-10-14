import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFlashcard extends Document {
  studentId: Types.ObjectId;
  courseId?: Types.ObjectId;
  skillId?: Types.ObjectId;
  front: string;
  back: string;
  source: 'manual' | 'llm_generated';
  verified: boolean;
  reported: boolean;
  intervalDays: number;
  easeFactor: number;
  nextDueAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    skillId: { type: Schema.Types.ObjectId, ref: 'Skill' },
    front: { type: String, required: true },
    back: { type: String, required: true },
    source: { type: String, enum: ['manual', 'llm_generated'], default: 'manual' },
    verified: { type: Boolean, default: true },
    reported: { type: Boolean, default: false },
    intervalDays: { type: Number, default: 1 },
    easeFactor: { type: Number, default: 2.5 },
    nextDueAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

FlashcardSchema.index({ studentId: 1, nextDueAt: 1 });

export const Flashcard = mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);
