import { invoicesCollection, paymentsCollection } from '../../../models/index.js';
import { badRequest, notFound } from '../../../helpers/errors.js';
import generateNumber from '../Counter/generateNumber.js';
import refreshInvoiceStatus from '../Invoice/refreshInvoiceStatus.js';
import getPaymentById from './getPaymentById.js';

const insertPayment = async ({ invoiceId, amount, method, paidAt, reference, notes }, userId) => {
  const invoice = await invoicesCollection.findById(invoiceId).lean();
  if (!invoice) throw notFound('Invoice not found');
  if (invoice.status === 'cancelled') throw badRequest('This invoice is cancelled');
  const value = Math.round(Number(amount) * 100) / 100;
  const remaining = Math.round((invoice.amount - invoice.paidAmount) * 100) / 100;
  if (!(value > 0)) throw badRequest('The amount must be greater than 0');
  if (value > remaining) throw badRequest(`The amount is higher than what remains to pay (${remaining})`);

  const payment = await paymentsCollection.create({
    receiptNumber: await generateNumber('REC'),
    student: invoice.student,
    invoice: invoice._id,
    campus: invoice.campus,
    amount: value,
    method,
    paidAt: paidAt ? new Date(paidAt) : new Date(),
    reference,
    notes,
    receivedBy: userId,
  });
  await refreshInvoiceStatus(invoice._id);
  return getPaymentById(payment._id);
};

export default insertPayment;
