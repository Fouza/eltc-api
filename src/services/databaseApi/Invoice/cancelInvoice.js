import { invoicesCollection } from '../../../models/index.js';
import { conflict } from '../../../helpers/errors.js';

const cancelInvoice = async (id) => {
  const invoice = await invoicesCollection.findById(id).lean();
  if (invoice?.paidAmount > 0) throw conflict('This invoice has payments. Delete the payments first or lower the amount.');
  return invoicesCollection.findByIdAndUpdate(id, { $set: { status: 'cancelled' } }, { returnDocument: 'after' }).lean();
};

export default cancelInvoice;
