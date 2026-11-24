import { invoicesCollection } from '../../../models/index.js';
import { pick } from '../../../helpers/strings.js';
import { badRequest } from '../../../helpers/errors.js';
import { BLOCK_DAYS } from '../../../helpers/dates.js';
import refreshInvoiceStatus from './refreshInvoiceStatus.js';

const updateInvoice = async (id, data) => {
  const invoice = await invoicesCollection.findById(id).lean();
  if (!invoice) return null;
  if (data.amount !== undefined && Number(data.amount) < invoice.paidAmount) throw badRequest('The amount cannot be lower than what was already paid');
  const set = pick(data, ['label', 'amount', 'dueDate', 'notes']);
  // A new due date moves the overdue date by the same amount, keeping the time the student had to pay
  // (books stay overdue at the end of their level).
  if (set.dueDate && invoice.kind !== 'book') {
    const gap = invoice.overdueAt && invoice.dueDate ? invoice.overdueAt - invoice.dueDate : BLOCK_DAYS * 24 * 3600 * 1000;
    set.overdueAt = new Date(new Date(set.dueDate).getTime() + gap);
  }
  await invoicesCollection.updateOne({ _id: id }, { $set: set }, { runValidators: true });
  return refreshInvoiceStatus(id);
};

export default updateInvoice;
