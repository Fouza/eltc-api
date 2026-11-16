import { Schema } from 'mongoose';

// A single document (_id: 'school') with school-wide settings editable from the UI.
const settingSchema = new Schema(
  {
    _id: { type: String, default: 'school' },
    schoolName: { type: String, default: 'ELTC School' },
    currency: { type: String, default: 'DZD' },
    locale: { type: String, default: 'fr-FR' },
    defaultMaxScore: { type: Number, default: 20 },
    defaultPassScore: { type: Number, default: 10 },
    defaultInstallments: { type: Number, default: 1 },
    lowAttendanceThreshold: { type: Number, default: 3 }, // absences in the last 30 days
    overdueGraceDays: { type: Number, default: 0 },
    groupAlmostFullRatio: { type: Number, default: 0.9 },
  },
  { timestamps: true },
);

export default settingSchema;
