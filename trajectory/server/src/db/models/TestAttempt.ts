import mongoose, { Document, Schema, Types } from 'mongoose';

const AnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    correct: { type: Boolean, required: true },
    errorType: { type: String, enum: ['concept_gap', 'careless', 'time_pressure'] },
    topic: { type: String, required: true },
  },
  { _id: false }
);

const FixItemSchema = new Schema(
  { item: String, action: String, priority: Number },
  { _id: false }
);

export interface ITestAttempt extends Document {
  studentId: Types.ObjectId;
  ladderTestId: Types.ObjectId;
  answers: Array<{
    questionId: string;
    correct: boolean;
    errorType?: 'concept_gap' | 'careless' | 'time_pressure';
    topic: string;
  }>;
  autopsy: {
    conceptGaps: string[];
    carelessMistakes: string[];
    timePressureItems: string[];
    fixList: Array<{ item: string; action: string; priority: number }>;
  };
  timeTaken: number;
}

const TestAttemptSchema = new Schema<ITestAttempt>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    ladderTestId: { type: Schema.Types.ObjectId, ref: 'LadderTest', required: true },
    answers: { type: [AnswerSchema], default: [] },
    autopsy: {
      conceptGaps: { type: [String], default: [] },
      carelessMistakes: { type: [String], default: [] },
      timePressureItems: { type: [String], default: [] },
      fixList: { type: [FixItemSchema], default: [] },
    },
    timeTaken: { type: Number, required: true },
  },
  { timestamps: true }
);

export const TestAttempt = mongoose.model<ITestAttempt>('TestAttempt', TestAttemptSchema);
