import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFocusSession extends Document {
  studentId: Types.ObjectId;
  taskId: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
  technique: 'pomodoro' | 'flow';
  interrupted: boolean;
  retrievalPracticeCompleted: boolean;
  petXpAwarded: number;
}

const FocusSessionSchema = new Schema<IFocusSession>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: Date,
    durationMinutes: Number,
    technique: { type: String, enum: ['pomodoro', 'flow'], default: 'pomodoro' },
    interrupted: { type: Boolean, default: false },
    retrievalPracticeCompleted: { type: Boolean, default: false },
    petXpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FocusSessionSchema.index({ studentId: 1, startedAt: -1 });

export const FocusSession = mongoose.model<IFocusSession>('FocusSession', FocusSessionSchema);
