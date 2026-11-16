import { paymentsCollection } from '../../../models/index.js';

// Everything needed to print a receipt.
const getPaymentById = (id) =>
  paymentsCollection
    .findById(id)
    .populate('student', 'firstName lastName studentNumber phone guardian')
    .populate('invoice', 'number label amount paidAmount status dueDate installment')
    .populate('campus', 'name code address city phone email')
    .populate('receivedBy', 'firstName lastName')
    .lean();

export default getPaymentById;
