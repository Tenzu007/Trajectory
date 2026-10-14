import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITarget extends Document {
  studentId: Types.ObjectId;
  dreamId: Types.ObjectId;
  type: 'cgpa' | 'subject_grade' | 'skill' | 'role' | 'backlog_clear' | 'other';
  description: string;
  measurableValue: number | string;
  deadline: Date;
  currentValue: number | string;
  gapScore: number;
}

const TargetSchema = new Schema<ITarget>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    dreamId: { type: Schema.Types.ObjectId, ref: 'Dream', required: true },
    type: {
      type: String,
      enum: ['cgpa', 'subject_grade', 'skill', 'role', 'backlog_clear', 'other'],
      required: true,
    },
    description: { type: String, required: true },
    measurableValue: { type: Schema.Types.Mixed, required: true },
    deadline: { type: Date, required: true },
    currentValue: { type: Schema.Types.Mixed, required: true },
    gapScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

export const Target = mongoose.model<ITarget>('Target', TargetSchema);
