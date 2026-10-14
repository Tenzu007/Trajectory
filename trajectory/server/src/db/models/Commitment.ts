import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICommitment extends Document {
  studentId: Types.ObjectId;
  taskId: Types.ObjectId;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: 'kept' | 'missed' | 'rescheduled' | 'released';
  keepRate: number;
}

const CommitmentSchema = new Schema<ICommitment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    scheduledStart: { type: Date, required: true },
    scheduledEnd: { type: Date, required: true },
    status: { type: String, enum: ['kept', 'missed', 'rescheduled', 'released'], default: 'kept' },
    keepRate: { type: Number, min: 0, max: 1, default: 1 },
  },
  { timestamps: true }
);

CommitmentSchema.index({ studentId: 1, scheduledStart: -1 });

export const Commitment = mongoose.model<ICommitment>('Commitment', CommitmentSchema);
