import { Schema } from 'mongoose';
import { ENROLLMENT_STATUS, FINAL_RESULTS } from '../../constants/enums.js';

const enrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'student', required: true },
    group: { type: Schema.Types.ObjectId, ref: 'group', required: true },
    // Denormalised from the group so reports don't need lookups.
    program: { type: Schema.Types.ObjectId, ref: 'program', required: true },
    levelNumber: { type: Number, required: true },
    campus: { type: Schema.Types.ObjectId, ref: 'campus', required: true },
    status: { type: String, enum: ENROLLMENT_STATUS, default: 'active' },
    enrolledAt: { type: Date, default: Date.now },
    endedAt: Date,
    fee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountReason: { type: String, trim: true },
    finalResult: { type: String, enum: FINAL_RESULTS, default: 'pending' },
    finalScore: Number,
    transferredTo: { type: Schema.Types.ObjectId, ref: 'enrollment' },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  { timestamps: true },
);

enrollmentSchema.index({ group: 1, status: 1 });
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ campus: 1, status: 1 });

export default enrollmentSchema;
