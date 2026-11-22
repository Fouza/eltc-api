import { invoicesCollection, studentsCollection } from '../../../models/index.js';
import { badRequest } from '../../../helpers/errors.js';
import generateNumber from '../Counter/generateNumber.js';

// Manual invoice (registration fee, exam fee…). Course months and books are created on enrollment.
const insertInvoice = async (data, userId) => {
  const student = await studentsCollection.findById(data.student, { campus: 1 }).lean();
  if (!student) throw badRequest('Unknown student');
  const invoice = await invoicesCollection.create({
    ...data,
    kind: data.kind ?? 'other',
    campus: data.campus ?? student.campus,
    number: await generateNumber('INV'),
    paidAmount: 0,
    status: 'unpaid',
    createdBy: userId,
  });
  return invoice.toObject();
};

export default insertInvoice;
