import { invoicesCollection, paymentsCollection } from '../../../models/index.js';
import { badRequest, notFound } from '../../../helpers/errors.js';
import generateNumber from '../Counter/generateNumber.js';
import refreshInvoiceStatus from '../Invoice/refreshInvoiceStatus.js';
import getPaymentById from './getPaymentById.js';

const round = (n) => Math.round(n * 100) / 100;

// Records money received for an invoice. More than the invoice needs is fine: the extra pays the student's other
// open invoices, earliest due first (e.g. a whole level paid at once). One receipt lists every line.
// The limit is everything the student still owes — there is nothing to put the rest against.
const insertPayment = async ({ invoiceId, amount, method, paidAt, reference, notes }, userId) => {
  const invoice = await invoicesCollection.findById(invoiceId).lean();
  if (!invoice) throw notFound('Invoice not found');
  if (invoice.status === 'cancelled') throw badRequest('This invoice is cancelled');
  const value = round(Number(amount));
  if (!(value > 0)) throw badRequest('The amount must be greater than 0');

  const others = await invoicesCollection
    .find({ student: invoice.student, _id: { $ne: invoice._id }, status: { $in: ['unpaid', 'partial'] } })
    .sort({ dueDate: 1, createdAt: 1 })
    .lean();
  const open = [invoice, ...others].filter((i) => round(i.amount - i.paidAmount) > 0);
  const owed = round(open.reduce((s, i) => s + i.amount - i.paidAmount, 0));
  if (value > owed) throw badRequest(`The amount is higher than everything this student owes (${owed})`);

  // Split the money: the chosen invoice first, then the others in order.
  let left = value;
  const lines = [];
  for (const inv of open) {
    if (left <= 0) break;
    const part = round(Math.min(left, inv.amount - inv.paidAmount));
    lines.push({ inv, part });
    left = round(left - part);
  }

  const receipt = await generateNumber('REC');
  const created = [];
  for (const [i, { inv, part }] of lines.entries()) {
    created.push(
      await paymentsCollection.create({
        receiptNumber: i === 0 ? receipt : `${receipt}-${i + 1}`,
        receipt,
        student: inv.student,
        invoice: inv._id,
        campus: inv.campus,
        amount: part,
        method,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        reference,
        notes,
        receivedBy: userId,
      }),
    );
    await refreshInvoiceStatus(inv._id);
  }
  return getPaymentById(created[0]._id);
};

export default insertPayment;
