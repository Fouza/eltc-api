import { invoicesCollection } from '../../../models/index.js';
import { pick } from '../../../helpers/strings.js';
import { badRequest } from '../../../helpers/errors.js';
import refreshInvoiceStatus from './refreshInvoiceStatus.js';

const updateInvoice = async (id, data) => {
  const invoice = await invoicesCollection.findById(id).lean();
  if (!invoice) return null;
  if (data.amount !== undefined && Number(data.amount) < invoice.paidAmount) throw badRequest('The amount cannot be lower than what was already paid');
  await invoicesCollection.updateOne({ _id: id }, { $set: pick(data, ['label', 'amount', 'dueDate', 'notes']) }, { runValidators: true });
  return refreshInvoiceStatus(id);
};

export default updateInvoice;
