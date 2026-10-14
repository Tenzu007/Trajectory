import mongoose, { Document, Schema, Types } from 'mongoose';

const TopicSchema = new Schema(
  {
    name: { type: String, required: true },
    mastery: { type: Number, min: 0, max: 1, default: 0 },
    lastReviewed: Date,
    syllabusCovered: { type: Boolean, default: false },
  },
  { _id: true }
);

export interface ICourse extends Document {
  studentId: Types.ObjectId;
  name: string;
  code: string;
  semester: number;
  credits: number;
  attendanceConfig: { threshold: number };
  topics: Array<{
    _id?: Types.ObjectId;
    name: string;
    mastery: number;
    lastReviewed?: Date;
    syllabusCovered: boolean;
  }>;
  assessments: Types.ObjectId[];
  currentMarks: number;
  totalMarks: number;
  projectedGrade?: string;
  isBacklog: boolean;
}

const CourseSchema = new Schema<ICourse>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    credits: { type: Number, required: true, min: 1 },
    attendanceConfig: { threshold: { type: Number, default: 0.75 } },
    topics: { type: [TopicSchema], default: [] },
    assessments: [{ type: Schema.Types.ObjectId, ref: 'Assessment' }],
    currentMarks: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 100 },
    projectedGrade: String,
    isBacklog: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CourseSchema.index({ studentId: 1, semester: 1 });

export const Course = mongoose.model<ICourse>('Course', CourseSchema);
