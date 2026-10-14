import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IHealthCheckin extends Document {
  studentId: Types.ObjectId;
  date: Date;
  sleepHours: number;
  exercised: boolean;
  mood: 1 | 2 | 3 | 4 | 5;
  flaggedForWellbeing: boolean;
}

const HealthCheckinSchema = new Schema<IHealthCheckin>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    date: { type: Date, required: true },
    sleepHours: { type: Number, required: true, min: 0, max: 24 },
    exercised: { type: Boolean, default: false },
    mood: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
    flaggedForWellbeing: { type: Boolean, default: false },
  },
  { timestamps: true }
);

HealthCheckinSchema.index({ studentId: 1, date: -1 });

export const HealthCheckin = mongoose.model<IHealthCheckin>('HealthCheckin', HealthCheckinSchema);
