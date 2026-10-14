import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISupportMapEntry extends Document {
  studentId: Types.ObjectId;
  backlogId?: Types.ObjectId;
  personName: string;
  role: 'professor' | 'ta' | 'senior' | 'peer' | 'mentor';
  specificAsk: string;
  checkInDate?: Date;
  messageTemplate: string;
  contacted: boolean;
}

const SupportMapEntrySchema = new Schema<ISupportMapEntry>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    backlogId: { type: Schema.Types.ObjectId, ref: 'Backlog' },
    personName: { type: String, required: true },
    role: {
      type: String,
      enum: ['professor', 'ta', 'senior', 'peer', 'mentor'],
      required: true,
    },
    specificAsk: { type: String, required: true },
    checkInDate: { type: Date },
    messageTemplate: { type: String, required: true },
    contacted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SupportMapEntrySchema.index({ studentId: 1, contacted: 1 });

export const SupportMapEntry = mongoose.model<ISupportMapEntry>(
  'SupportMapEntry',
  SupportMapEntrySchema
);
