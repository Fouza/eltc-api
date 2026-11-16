import { Schema } from 'mongoose';
import { NOTIFICATION_SEVERITY } from '../../constants/enums.js';

const notificationSchema = new Schema(
  {
    type: { type: String, required: true }, // payment_overdue, low_attendance, exam_not_graded, group_almost_full...
    severity: { type: String, enum: NOTIFICATION_SEVERITY, default: 'info' },
    title: { type: String, required: true },
    message: { type: String },
    link: { type: String }, // web route, e.g. /students/<id>
    campus: { type: Schema.Types.ObjectId, ref: 'campus' },
    roles: [String], // [] = every staff member
    readBy: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    dedupeKey: { type: String }, // so daily jobs don't create the same alert twice
  },
  { timestamps: true },
);

notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
notificationSchema.index({ createdAt: -1 });

export default notificationSchema;
