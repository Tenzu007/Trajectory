import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  email: string;
  passwordHash: string;
  googleId?: string;
  name: string;
  avatar?: string;
  config: {
    gradingScale: { max: number };
    attendanceThreshold: number;
    creditRules: { passMark: number };
    gradeSchema: Array<{ grade: string; minPercent: number; points: number }>;
  };
  priors: {
    taskDurationMultiplier: Record<string, number>;
    peakFocusHours: number[];
    preferredFocusLength: number;
    weeklyFreeHours: number;
  };
  onboardingCompleted: boolean;
  universityPreset?: string;
  mentorEmail?: string;
  parentEmail?: string;
  sharedFields: string[];
  exportRequestedAt?: Date;
  deletedAt?: Date;
  refreshTokenHash?: string;
}

const GradePointSchema = new Schema(
  { grade: String, minPercent: Number, points: Number },
  { _id: false }
);

const StudentSchema = new Schema<IStudent>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    googleId: { type: String, sparse: true },
    name: { type: String, required: true, trim: true },
    avatar: String,
    config: {
      gradingScale: { max: { type: Number, default: 10 } },
      attendanceThreshold: { type: Number, default: 0.75 },
      creditRules: { passMark: { type: Number, default: 40 } },
      gradeSchema: { type: [GradePointSchema], default: [
        { grade: 'O',  minPercent: 91, points: 10 },
        { grade: 'A+', minPercent: 81, points: 9 },
        { grade: 'A',  minPercent: 71, points: 8 },
        { grade: 'B+', minPercent: 61, points: 7 },
        { grade: 'B',  minPercent: 51, points: 6 },
        { grade: 'C',  minPercent: 41, points: 5 },
        { grade: 'F',  minPercent: 0,  points: 0 },
      ]},
    },
    priors: {
      taskDurationMultiplier: { type: Map, of: Number, default: { theory: 1.2, practical: 0.9, assignment: 1.0, quiz: 0.8 } },
      peakFocusHours: { type: [Number], default: [9, 10, 11] },
      preferredFocusLength: { type: Number, default: 25 },
      weeklyFreeHours: { type: Number, default: 20 },
    },
    onboardingCompleted: { type: Boolean, default: false },
    universityPreset: { type: String, default: 'autonomous_ugc' },
    mentorEmail: String,
    parentEmail: String,
    sharedFields: { type: [String], default: [] },
    exportRequestedAt: Date,
    deletedAt: Date,
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

// Never return passwordHash or refreshTokenHash in normal queries
StudentSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    delete ret.passwordHash;
    delete ret.refreshTokenHash;
    return ret;
  },
});

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
