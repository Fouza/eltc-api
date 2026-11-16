import { paymentsCollection } from '../../../models/index.js';
import refreshInvoiceStatus from '../Invoice/refreshInvoiceStatus.js';

const deletePayment = async (id) => {
  const payment = await paymentsCollection.findByIdAndDelete(id).lean();
  if (payment) await refreshInvoiceStatus(payment.invoice);
  return { ok: Boolean(payment) };
};

export default deletePayment;
