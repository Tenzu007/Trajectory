import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAttendanceRecord extends Document {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'cancelled';
  classType: 'lecture' | 'lab' | 'tutorial';
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'cancelled'], required: true },
    classType: { type: String, enum: ['lecture', 'lab', 'tutorial'], required: true },
  },
  { timestamps: true }
);

AttendanceRecordSchema.index({ studentId: 1, courseId: 1, date: -1 });
// Prevent duplicate records for same class slot
AttendanceRecordSchema.index({ studentId: 1, courseId: 1, date: 1, classType: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
