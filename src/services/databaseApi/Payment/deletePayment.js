import { paymentsCollection } from '../../../models/index.js';
import refreshInvoiceStatus from '../Invoice/refreshInvoiceStatus.js';

// Deletes a payment typed by mistake — the whole receipt when it paid several invoices — and reopens the invoices.
const deletePayment = async (id) => {
  const payment = await paymentsCollection.findById(id).lean();
  if (!payment) return { ok: false };
  const lines = payment.receipt ? await paymentsCollection.find({ receipt: payment.receipt }).lean() : [payment];
  await paymentsCollection.deleteMany({ _id: { $in: lines.map((l) => l._id) } });
  for (const l of lines) await refreshInvoiceStatus(l.invoice);
  return { ok: true, deleted: lines.length };
};

export default deletePayment;
