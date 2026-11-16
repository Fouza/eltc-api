import { Schema } from 'mongoose';
import { EXAM_STATUS, EXAM_TYPES } from '../../constants/enums.js';

const examSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: EXAM_TYPES, default: 'quiz' },
    group: { type: Schema.Types.ObjectId, ref: 'group', required: true },
    program: { type: Schema.Types.ObjectId, ref: 'program', required: true },
    levelNumber: { type: Number, required: true },
    campus: { type: Schema.Types.ObjectId, ref: 'campus', required: true },
    date: { type: Date, required: true },
    maxScore: { type: Number, default: 20 },
    passScore: { type: Number, default: 10 },
    coefficient: { type: Number, default: 1 },
    status: { type: String, enum: EXAM_STATUS, default: 'scheduled' },
    results: [
      {
        _id: false,
        student: { type: Schema.Types.ObjectId, ref: 'student', required: true },
        score: Number,
        absent: { type: Boolean, default: false },
        comment: { type: String, trim: true },
      },
    ],
    notes: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  { timestamps: true },
);

examSchema.index({ group: 1, date: 1 });
examSchema.index({ campus: 1, date: 1 });
examSchema.index({ status: 1, date: 1 });
examSchema.index({ 'results.student': 1 });

export default examSchema;
