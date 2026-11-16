import { invoicesCollection, paymentsCollection } from '../../../models/index.js';

// Recomputes paidAmount and status from the payments. Call after any payment change.
const refreshInvoiceStatus = async (invoiceId) => {
  const invoice = await invoicesCollection.findById(invoiceId);
  if (!invoice) return null;
  const [sum] = await paymentsCollection.aggregate([{ $match: { invoice: invoice._id } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  invoice.paidAmount = Math.round((sum?.total ?? 0) * 100) / 100;
  if (invoice.status !== 'cancelled') {
    invoice.status = invoice.paidAmount >= invoice.amount ? 'paid' : invoice.paidAmount > 0 ? 'partial' : 'unpaid';
  }
  await invoice.save();
  return invoice.toObject();
};

export default refreshInvoiceStatus;
