import { enrollmentsCollection, invoicesCollection } from '../../../models/index.js';
import { pick } from '../../../helpers/strings.js';
import { notFound } from '../../../helpers/errors.js';
import syncStudentStatus from './syncStudentStatus.js';

// Status change (drop, complete), final result, notes. When dropping, unpaid future invoices can be cancelled.
const updateEnrollment = async (id, data) => {
  const enrollment = await enrollmentsCollection.findById(id).lean();
  if (!enrollment) throw notFound('Enrollment not found');
  const set = pick(data, ['status', 'finalResult', 'finalScore', 'notes', 'discountReason']);
  if (set.status && set.status !== 'active' && enrollment.status === 'active') set.endedAt = new Date();
  if (set.status === 'active') set.endedAt = null;
  await enrollmentsCollection.updateOne({ _id: id }, { $set: set }, { runValidators: true });

  if (set.status === 'dropped' && data.cancelUnpaidInvoices) {
    await invoicesCollection.updateMany(
      { enrollment: id, status: 'unpaid', dueDate: { $gte: new Date() } },
      { $set: { status: 'cancelled', notes: 'Cancelled: student left the group' } },
    );
  }
  await syncStudentStatus(enrollment.student);
  return enrollmentsCollection.findById(id).lean();
};

export default updateEnrollment;
