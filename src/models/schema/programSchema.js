import { Schema } from 'mongoose';
import { AUDIENCES } from '../../constants/enums.js';

// A "workshop": one language for one audience, split into levels (6 by default).
const levelSchema = new Schema(
  {
    number: { type: Number, required: true, min: 1 },
    name: { type: String, trim: true }, // e.g. "Level 1 – Beginner" or "A1"
    description: { type: String, trim: true },
    durationWeeks: { type: Number, default: 12 },
    hours: { type: Number, default: 36 },
    fee: { type: Number, default: 0 },
  },
  { _id: false },
);

const programSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    language: { type: Schema.Types.ObjectId, ref: 'language', required: true },
    audience: { type: String, enum: AUDIENCES, required: true },
    minAge: Number,
    maxAge: Number,
    description: { type: String, trim: true },
    color: { type: String },
    levels: { type: [levelSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

programSchema.index({ language: 1, audience: 1 });

export default programSchema;
