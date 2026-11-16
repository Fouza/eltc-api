import { Schema } from 'mongoose';
import { INVOICE_STATUS } from '../../constants/enums.js';

// What a student owes. Overdue = not paid/cancelled and dueDate in the past (computed, not stored).
const invoiceSchema = new Schema(
  {
    number: { type: String, unique: true }, // INV-2026-0001
    student: { type: Schema.Types.ObjectId, ref: 'student', required: true },
    enrollment: { type: Schema.Types.ObjectId, ref: 'enrollment' },
    campus: { type: Schema.Types.ObjectId, ref: 'campus', required: true },
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: INVOICE_STATUS, default: 'unpaid' },
    installment: { index: Number, count: Number },
    lastReminderAt: Date,
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  { timestamps: true },
);

invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ student: 1, dueDate: 1 });
invoiceSchema.index({ campus: 1, status: 1, dueDate: 1 });
invoiceSchema.index({ enrollment: 1 });

export default invoiceSchema;
