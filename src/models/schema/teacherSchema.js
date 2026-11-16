import { Schema } from 'mongoose';

// Teachers don't log in: they are records the staff assigns to groups.
const teacherSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    languages: [{ type: Schema.Types.ObjectId, ref: 'language' }],
    campusIds: [{ type: Schema.Types.ObjectId, ref: 'campus' }],
    hourlyRate: Number,
    active: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

teacherSchema.index({ lastName: 1, firstName: 1 });

export default teacherSchema;
