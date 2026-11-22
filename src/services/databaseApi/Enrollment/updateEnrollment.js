import { enrollmentsCollection, invoicesCollection } from '../../../models/index.js';
import { pick } from '../../../helpers/strings.js';
import { notFound } from '../../../helpers/errors.js';
import syncStudentStatus from './syncStudentStatus.js';
import { startOfToday } from '../../../helpers/dates.js';

// Status change (drop, complete), final result, notes.
// When a student leaves (dropped or transferred), the months that haven't started yet are cancelled;
// the current month stays due. Unpaid books not handed over yet are cancelled too. Pass cancelFutureInvoices: false to keep everything.
const updateEnrollment = async (id, data) => {
  const enrollment = await enrollmentsCollection.findById(id).lean();
  if (!enrollment) throw notFound('Enrollment not found');
  const set = pick(data, ['status', 'finalResult', 'finalScore', 'notes', 'discountReason']);
  if (set.status && set.status !== 'active' && enrollment.status === 'active') set.endedAt = new Date();
  if (set.status === 'active') set.endedAt = null;
  await enrollmentsCollection.updateOne({ _id: id }, { $set: set }, { runValidators: true });

  if (['dropped', 'transferred'].includes(set.status) && enrollment.status === 'active' && data.cancelFutureInvoices !== false) {
    await invoicesCollection.updateMany(
      { enrollment: id, kind: { $ne: 'book' }, status: 'unpaid', dueDate: { $gt: startOfToday() } },
      { $set: { status: 'cancelled', notes: 'Cancelled: student left the group' } },
    );
    await invoicesCollection.updateMany(
      { enrollment: id, kind: 'book', status: 'unpaid', handedOverAt: null },
      { $set: { status: 'cancelled', notes: 'Cancelled: student left before receiving the book' } },
    );
  }
  await syncStudentStatus(enrollment.student);
  return enrollmentsCollection.findById(id).lean();
};

export default updateEnrollment;
