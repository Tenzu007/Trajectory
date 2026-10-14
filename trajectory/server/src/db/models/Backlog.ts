import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBacklog extends Document {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  suppExamDate: Date;
  syllabusRemaining: string[];
  prerequisiteChain: string[];
  pastScore: number;
  credits: number;
  recoveryValue: number;
  rootCause?: 'foundations' | 'technique' | 'attendance' | 'time_clash';
  vectorBMinutes: { default: number; minimum: number };
  supportMap: Types.ObjectId[];
  milestoneReviews: Array<{ date: Date; diagnosticScore: number; onTrack: boolean }>;
}

const MilestoneReviewSchema = new Schema(
  { date: Date, diagnosticScore: Number, onTrack: Boolean },
  { _id: false }
);

const BacklogSchema = new Schema<IBacklog>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    suppExamDate: { type: Date, required: true },
    syllabusRemaining: { type: [String], default: [] },
    prerequisiteChain: { type: [String], default: [] },
    pastScore: { type: Number, default: 0 },
    credits: { type: Number, required: true },
    recoveryValue: { type: Number, default: 0 },
    rootCause: { type: String, enum: ['foundations', 'technique', 'attendance', 'time_clash'] },
    vectorBMinutes: {
      default: { type: Number, default: 90 },
      minimum: { type: Number, default: 45 },
    },
    supportMap: [{ type: Schema.Types.ObjectId, ref: 'SupportMapEntry' }],
    milestoneReviews: { type: [MilestoneReviewSchema], default: [] },
  },
  { timestamps: true }
);

BacklogSchema.index({ studentId: 1, suppExamDate: 1 });

export const Backlog = mongoose.model<IBacklog>('Backlog', BacklogSchema);
