import { enrollmentsCollection, groupsCollection, invoicesCollection } from '../../../models/index.js';
import { badRequest, conflict, notFound } from '../../../helpers/errors.js';

// Moves a student to another group (other schedule, other campus...). Open invoices follow the student.
const transferEnrollment = async (id, targetGroupId, userId) => {
  const [enrollment, target] = await Promise.all([
    enrollmentsCollection.findById(id).lean(),
    groupsCollection.findById(targetGroupId).lean(),
  ]);
  if (!enrollment) throw notFound('Enrollment not found');
  if (!target) throw notFound('Target group not found');
  if (enrollment.status !== 'active') throw badRequest('Only active enrollments can be transferred');
  if (String(enrollment.group) === String(targetGroupId)) throw badRequest('The student is already in this group');
  if (await enrollmentsCollection.exists({ student: enrollment.student, group: targetGroupId, status: 'active' })) {
    throw conflict('The student is already in the target group');
  }

  const { _id, createdAt: _c, updatedAt: _u, ...rest } = enrollment;
  const created = await enrollmentsCollection.create({
    ...rest,
    group: target._id,
    program: target.program,
    levelNumber: target.levelNumber,
    campus: target.campus,
    status: 'active',
    enrolledAt: new Date(),
    notes: `Transferred from another group`,
    createdBy: userId,
  });
  await enrollmentsCollection.updateOne({ _id }, { $set: { status: 'transferred', endedAt: new Date(), transferredTo: created._id } });
  await invoicesCollection.updateMany({ enrollment: _id, status: { $in: ['unpaid', 'partial'] } }, { $set: { enrollment: created._id, campus: target.campus } });
  return created.toObject();
};

export default transferEnrollment;
