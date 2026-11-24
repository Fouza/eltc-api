import { Schema } from 'mongoose';
import { CERTIFICATE_RECEIVERS, CERTIFICATE_STATUS } from '../../constants/enums.js';

// One certificate per passed enrollment (a student who passed a level).
// Life: issued (ready to collect) → handed over, or revoked if issued by mistake.
// What is printed is copied at issue time, so renaming a program or a group later doesn't change a certificate already given.
const certificateSchema = new Schema(
  {
    number: { type: String, required: true, unique: true }, // CERT-2026-0001
    code: { type: String, required: true, unique: true }, // random, for the public verification link / QR code
    enrollment: { type: Schema.Types.ObjectId, ref: 'enrollment', required: true }, // at most one that isn't revoked (checked when issuing)
    student: { type: Schema.Types.ObjectId, ref: 'student', required: true },
    group: { type: Schema.Types.ObjectId, ref: 'group' },
    program: { type: Schema.Types.ObjectId, ref: 'program' },
    levelNumber: Number,
    campus: { type: Schema.Types.ObjectId, ref: 'campus', required: true },
    // Printed details (snapshot).
    studentName: { type: String, required: true },
    birthDate: Date,
    birthPlace: String,
    programName: String,
    languageName: String,
    levelName: String,
    campusName: String,
    startDate: Date,
    endDate: Date,
    hours: Number,
    finalScore: Number,
    mention: String,
    // Life cycle.
    status: { type: String, enum: CERTIFICATE_STATUS, default: 'ready' },
    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'user' },
    printCount: { type: Number, default: 0 },
    lastPrintedAt: Date,
    handedOverAt: Date,
    handedOverTo: { type: String, trim: true }, // name of the person who collected it
    receiver: { type: String, enum: CERTIFICATE_RECEIVERS },
    handedOverBy: { type: Schema.Types.ObjectId, ref: 'user' },
    revokedAt: Date,
    revokedReason: { type: String, trim: true },
    revokedBy: { type: Schema.Types.ObjectId, ref: 'user' },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

certificateSchema.index({ campus: 1, status: 1 });
certificateSchema.index({ student: 1 });
certificateSchema.index({ enrollment: 1, status: 1 });

export default certificateSchema;
