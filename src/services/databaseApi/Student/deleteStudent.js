import {
  studentsCollection, paymentsCollection, enrollmentsCollection, invoicesCollection, attendancesCollection, examsCollection,
} from '../../../models/index.js';
import { conflict } from '../../../helpers/errors.js';

// Only for mistakes (duplicates, test records). A student who paid is kept: mark them inactive instead.
const deleteStudent = async (id) => {
  if (await paymentsCollection.exists({ student: id })) throw conflict('This student has payments. Mark them as inactive instead.');
  await Promise.all([
    enrollmentsCollection.deleteMany({ student: id }),
    invoicesCollection.deleteMany({ student: id }),
    attendancesCollection.updateMany({}, { $pull: { entries: { student: id } } }),
    examsCollection.updateMany({}, { $pull: { results: { student: id } } }),
  ]);
  await studentsCollection.deleteOne({ _id: id });
  return { ok: true };
};

export default deleteStudent;
