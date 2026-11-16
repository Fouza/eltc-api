import { Schema } from 'mongoose';
import { GENDERS, STUDENT_STATUS } from '../../constants/enums.js';

// Mirrors the paper registration form.
const studentSchema = new Schema(
  {
    studentNumber: { type: String, unique: true }, // ELTC-26-0001
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    gender: { type: String, enum: GENDERS },
    birthDate: Date,
    phone: { type: String, trim: true },
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
    preferredSlots: { type: String, trim: true }, // free text from the form ("weekday evenings")
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
studentSchema.index({ desiredProgram: 1, desiredLevel: 1 });

export default studentSchema;
