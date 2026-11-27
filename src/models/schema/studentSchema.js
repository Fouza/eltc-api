import { Schema } from 'mongoose';
import { GENDERS, STUDENT_STATUS } from '../../constants/enums.js';
import { PREFERRED_TIME_KEYS } from '../../constants/sessions.js';

// Mirrors the paper registration form.
const studentSchema = new Schema(
  {
    studentNumber: { type: String, unique: true }, // ELTC-2026-0001
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    gender: { type: String, enum: GENDERS },
    birthDate: Date,
    birthPlace: { type: String, trim: true },
    phone: { type: String, trim: true },
    phone2: { type: String, trim: true }, // a second number (often the other parent)
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    occupation: { type: String, trim: true }, // job, school or university
    guardian: {
      name: { type: String, trim: true },
      relation: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    campus: { type: Schema.Types.ObjectId, ref: 'campus', required: true },
    status: { type: String, enum: STUDENT_STATUS, default: 'prospect' },
    registeredAt: { type: Date, default: Date.now },
    // Waiting list: what the student asked for before being placed in a group.
    desiredProgram: { type: Schema.Types.ObjectId, ref: 'program' },
    desiredLevel: Number,
    preferredTime: { type: String, enum: PREFERRED_TIME_KEYS, set: (v) => v || null }, // a kids session or an adults schedule; empty = any time
    preferredSlots: { type: String, trim: true }, // older free text ("weekday evenings"), still shown when set
    source: { type: String, trim: true }, // how they heard about the school
    tags: [String],
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  { timestamps: true },
);

studentSchema.index({ campus: 1, status: 1 });
studentSchema.index({ lastName: 1, firstName: 1 });
studentSchema.index({ firstName: 1 });
studentSchema.index({ phone: 1 });
studentSchema.index({ phone2: 1 });

// "0550…/0661…" typed in one box: the second number goes to phone2.
export const splitPhones = (doc) => {
  const parts = String(doc.phone ?? '').split(/\s*[/,;]\s*|\s+-\s+/).filter(Boolean);
  if (parts.length < 2) return doc;
  doc.phone = parts[0];
  if (!doc.phone2) doc.phone2 = parts.slice(1).join(' / ');
  return doc;
};
studentSchema.pre('validate', function splitPhoneField() {
  splitPhones(this);
});
studentSchema.index({ desiredProgram: 1, desiredLevel: 1, preferredTime: 1 });

export default studentSchema;
