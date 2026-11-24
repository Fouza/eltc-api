import { Schema } from 'mongoose';
import { INVOICE_KINDS, INVOICE_STATUS } from '../../constants/enums.js';
import { addDays, BLOCK_DAYS } from '../../helpers/dates.js';

// What a student owes: a 4-week block of a course, a book, or anything else (registration fee…).
// Overdue = not paid/cancelled and overdueAt in the past. Courses: the first day of the next 4-week block (set by the plan).
// Books: when the level ends. Anything else: 4 weeks after the due date.
const invoiceSchema = new Schema(
  {
    number: { type: String, unique: true }, // INV-2026-0001
    student: { type: Schema.Types.ObjectId, ref: 'student', required: true },
    enrollment: { type: Schema.Types.ObjectId, ref: 'enrollment' },
    group: { type: Schema.Types.ObjectId, ref: 'group' }, // for the payments filter
    kind: { type: String, enum: INVOICE_KINDS, default: 'course' },
    book: { type: Schema.Types.ObjectId, ref: 'book' },
    handedOverAt: Date, // books: when the student received it (takes it out of the campus stock)
    campus: { type: Schema.Types.ObjectId, ref: 'campus', required: true },
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    overdueAt: { type: Date }, // set automatically from dueDate when missing
    status: { type: String, enum: INVOICE_STATUS, default: 'unpaid' },
    installment: { index: Number, count: Number, fromWeek: Number, toWeek: Number },
    lastReminderAt: Date,
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'user' },
  },
  { timestamps: true },
);

invoiceSchema.pre('validate', function setOverdueAt() {
  if (!this.overdueAt && this.dueDate) this.overdueAt = addDays(this.dueDate, BLOCK_DAYS);
});

invoiceSchema.index({ status: 1, overdueAt: 1 });
invoiceSchema.index({ kind: 1, group: 1 });
invoiceSchema.index({ book: 1 });
invoiceSchema.index({ student: 1, dueDate: 1 });
invoiceSchema.index({ campus: 1, status: 1, dueDate: 1 });
invoiceSchema.index({ enrollment: 1 });

export default invoiceSchema;
