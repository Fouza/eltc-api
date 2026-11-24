import { Schema } from 'mongoose';

// A single document (_id: 'school') with school-wide settings editable from the UI.
const settingSchema = new Schema(
  {
    _id: { type: String, default: 'school' },
    schoolName: { type: String, default: 'ELTC School' },
    currency: { type: String, default: 'DZD' },
    locale: { type: String, default: 'fr-FR' },
    defaultPassScore: { type: Number, default: 50, min: 0, max: 100 }, // % — exams are scored in percent
    lowAttendanceThreshold: { type: Number, default: 3 }, // absences in the last 30 days
    groupAlmostFullRatio: { type: Number, default: 0.9 },
  },
  { timestamps: true },
);

export default settingSchema;
