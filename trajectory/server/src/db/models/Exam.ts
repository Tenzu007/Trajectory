import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IExam extends Document {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  name: string;
  date: Date;
  syllabusTopics: string[];
  ladderTests: Types.ObjectId[];
  isBacklog: boolean;
}

const ExamSchema = new Schema<IExam>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    name: { type: String, required: true },
    date: { type: Date, required: true },
    syllabusTopics: { type: [String], default: [] },
    ladderTests: [{ type: Schema.Types.ObjectId, ref: 'LadderTest' }],
    isBacklog: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ExamSchema.index({ studentId: 1, date: 1 });

export const Exam = mongoose.model<IExam>('Exam', ExamSchema);
