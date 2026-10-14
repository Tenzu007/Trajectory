import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  studentId: Types.ObjectId;
  courseId?: Types.ObjectId;
  examId?: Types.ObjectId;
  backlogId?: Types.ObjectId;
  skillId?: Types.ObjectId;
  title: string;
  description?: string;
  type: 'study' | 'assignment' | 'practice' | 'skill' | 'health' | 'other';
  priorityScore: number;
  estimatedMinutes: number;
  actualMinutes?: number;
  steps: Array<{ _id: Types.ObjectId; description: string; completed: boolean }>;
  twoMinuteLaunch: string;
  scheduledAt: Date;
  completedAt?: Date;
  status: 'pending' | 'done' | 'rescheduled' | 'released';
  releaseEffect?: { gapScoreDelta: number; gradeForecastDelta: number };
}

const StepSchema = new Schema(
  { description: { type: String, required: true }, completed: { type: Boolean, default: false } },
  { _id: true }
);

const TaskSchema = new Schema<ITask>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam' },
    backlogId: { type: Schema.Types.ObjectId, ref: 'Backlog' },
    skillId: { type: Schema.Types.ObjectId, ref: 'Skill' },
    title: { type: String, required: true, trim: true },
    description: String,
    type: { type: String, enum: ['study', 'assignment', 'practice', 'skill', 'health', 'other'], default: 'study' },
    priorityScore: { type: Number, default: 0, min: 0, max: 100 },
    estimatedMinutes: { type: Number, required: true, min: 1 },
    actualMinutes: Number,
    steps: { type: [StepSchema], default: [] },
    twoMinuteLaunch: { type: String, default: 'Open your notes to the first page.' },
    scheduledAt: { type: Date, required: true },
    completedAt: Date,
    status: { type: String, enum: ['pending', 'done', 'rescheduled', 'released'], default: 'pending' },
    releaseEffect: {
      gapScoreDelta: Number,
      gradeForecastDelta: Number,
    },
  },
  { timestamps: true }
);

TaskSchema.index({ studentId: 1, scheduledAt: 1 });
TaskSchema.index({ studentId: 1, status: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
