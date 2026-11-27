import { invoicesCollection, paymentsCollection } from '../../../models/index.js';

const getInvoiceById = async (id) => {
  const invoice = await invoicesCollection
    .findById(id)
    .populate('student', 'firstName lastName studentNumber phone phone2 guardian')
    .populate('campus', 'name code')
    .lean();
  if (!invoice) return null;
  const payments = await paymentsCollection.find({ invoice: id }).populate('receivedBy', 'firstName lastName').sort({ paidAt: 1 }).lean();
  return { ...invoice, payments };
};

export default getInvoiceById;
