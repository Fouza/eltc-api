import { paymentsCollection } from '../../../models/index.js';

const INVOICE_FIELDS = 'number label amount paidAmount status dueDate installment';

// Everything needed to print a receipt, with all its lines (a receipt can pay several invoices) and the total received.
const getPaymentById = async (id) => {
  const payment = await paymentsCollection
    .findById(id)
    .populate('student', 'firstName lastName studentNumber phone guardian')
    .populate('invoice', INVOICE_FIELDS)
    .populate('campus', 'name code address city phone email')
    .populate('receivedBy', 'firstName lastName')
    .lean();
  if (!payment) return null;
  const lines = payment.receipt
    ? await paymentsCollection.find({ receipt: payment.receipt }).populate('invoice', INVOICE_FIELDS).sort({ createdAt: 1, _id: 1 }).lean()
    : [payment];
  const total = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  return { ...payment, receiptNumber: payment.receipt ?? payment.receiptNumber, lines, total };
};

export default getPaymentById;
