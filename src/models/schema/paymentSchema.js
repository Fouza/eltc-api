import { Schema } from 'mongoose';
import { PAYMENT_METHODS } from '../../constants/enums.js';

const paymentSchema = new Schema(
  {
    receiptNumber: { type: String, unique: true }, // REC-2026-0001 (REC-2026-0001-2, -3… for the other lines of the same receipt)
    // One receipt can pay several invoices: every line shares the main receipt number here (empty on older payments).
    receipt: { type: String },
    student: { type: Schema.Types.ObjectId, ref: 'student', required: true },
    invoice: { type: Schema.Types.ObjectId, ref: 'invoice', required: true },
    campus: { type: Schema.Types.ObjectId, ref: 'campus', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
    paidAt: { type: Date, default: Date.now },
    reference: { type: String, trim: true }, // cheque / transfer number
    notes: { type: String, trim: true },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  { timestamps: true },
);

paymentSchema.index({ paidAt: -1 });
paymentSchema.index({ campus: 1, paidAt: -1 });
paymentSchema.index({ student: 1, paidAt: -1 });
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ receipt: 1 });

export default paymentSchema;
