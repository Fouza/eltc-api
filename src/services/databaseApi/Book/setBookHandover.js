import { invoicesCollection } from '../../../models/index.js';
import { badRequest, notFound } from '../../../helpers/errors.js';
import changeBookStock from './changeBookStock.js';

// Marks a book invoice as handed over to the student (or undoes it). Takes the copy out of that campus's stock.
const setBookHandover = async (invoiceId, handedOver) => {
  const invoice = await invoicesCollection.findById(invoiceId).lean();
  if (!invoice) throw notFound('Invoice not found');
  if (invoice.kind !== 'book' || !invoice.book) throw badRequest('This invoice is not for a book');
  if (Boolean(invoice.handedOverAt) === Boolean(handedOver)) return invoice;
  await changeBookStock(invoice.book, invoice.campus, handedOver ? -1 : 1);
  return invoicesCollection.findByIdAndUpdate(invoiceId, { $set: { handedOverAt: handedOver ? new Date() : null } }, { returnDocument: 'after' }).lean();
};

export default setBookHandover;
