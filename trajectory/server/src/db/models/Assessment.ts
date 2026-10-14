import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAssessment extends Document {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  name: string;
  type: 'assignment' | 'quiz' | 'lab' | 'project' | 'exam' | 'other';
  weight: number;
  maxMarks: number;
  scoredMarks?: number;
  dueDate: Date;
  submittedAt?: Date;
  onTime: boolean;
  status: 'pending' | 'submitted' | 'graded';
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['assignment', 'quiz', 'lab', 'project', 'exam', 'other'], required: true },
    weight: { type: Number, required: true, min: 0, max: 1 },
    maxMarks: { type: Number, required: true, min: 0 },
    scoredMarks: Number,
    dueDate: { type: Date, required: true },
    submittedAt: Date,
    onTime: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'submitted', 'graded'], default: 'pending' },
  },
  { timestamps: true }
);

AssessmentSchema.index({ studentId: 1, courseId: 1, dueDate: 1 });

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
