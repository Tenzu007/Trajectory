import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IForecast extends Document {
  studentId: Types.ObjectId;
  generatedAt: Date;
  cgpaRange: { p10: number; p50: number; p90: number };
  simulationInputs: {
    remainingAssessments: Array<{ courseId: Types.ObjectId; weight: number; maxMarks: number }>;
    currentPerf: Array<{ courseId: Types.ObjectId; currentPct: number }>;
  };
  scenarios: Array<{ action: string; cgpaDelta: number }>;
  seedUsed: number;
}

const ForecastSchema = new Schema<IForecast>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    generatedAt: { type: Date, default: Date.now },
    cgpaRange: {
      p10: Number,
      p50: Number,
      p90: Number,
    },
    simulationInputs: {
      remainingAssessments: [{ courseId: Schema.Types.ObjectId, weight: Number, maxMarks: Number, _id: false }],
      currentPerf: [{ courseId: Schema.Types.ObjectId, currentPct: Number, _id: false }],
    },
    scenarios: [{ action: String, cgpaDelta: Number, _id: false }],
    seedUsed: { type: Number, required: true },
  },
  { timestamps: true }
);

ForecastSchema.index({ studentId: 1, generatedAt: -1 });

export const Forecast = mongoose.model<IForecast>('Forecast', ForecastSchema);
