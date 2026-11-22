import { invoicesCollection } from '../../../models/index.js';
import { pick } from '../../../helpers/strings.js';
import { badRequest } from '../../../helpers/errors.js';
import { addMonths } from '../../../helpers/dates.js';
import refreshInvoiceStatus from './refreshInvoiceStatus.js';

const updateInvoice = async (id, data) => {
  const invoice = await invoicesCollection.findById(id).lean();
  if (!invoice) return null;
  if (data.amount !== undefined && Number(data.amount) < invoice.paidAmount) throw badRequest('The amount cannot be lower than what was already paid');
  const set = pick(data, ['label', 'amount', 'dueDate', 'notes']);
  // A new due date moves the overdue date too (books stay overdue at the end of their level).
  if (set.dueDate && invoice.kind !== 'book') set.overdueAt = addMonths(set.dueDate, 1);
  await invoicesCollection.updateOne({ _id: id }, { $set: set }, { runValidators: true });
  return refreshInvoiceStatus(id);
};

export default updateInvoice;
