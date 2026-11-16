import { invoicesCollection, studentsCollection } from '../../../models/index.js';
import { badRequest } from '../../../helpers/errors.js';
import generateNumber from '../Counter/generateNumber.js';

// Manual invoice (registration fee, books, exam fee...) or one installment of an enrollment.
const insertInvoice = async (data, userId) => {
  const student = await studentsCollection.findById(data.student, { campus: 1 }).lean();
  if (!student) throw badRequest('Unknown student');
  const invoice = await invoicesCollection.create({
    ...data,
    campus: data.campus ?? student.campus,
    number: await generateNumber('INV'),
    paidAmount: 0,
    status: 'unpaid',
    createdBy: userId,
  });
  return invoice.toObject();
};

export default insertInvoice;
