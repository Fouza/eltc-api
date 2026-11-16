import { enrollmentsCollection, groupsCollection, studentsCollection, invoicesCollection } from '../../../models/index.js';
import { badRequest, conflict, notFound } from '../../../helpers/errors.js';
import generateNumber from '../Counter/generateNumber.js';
import buildInstallments from '../Invoice/buildInstallments.js';

// Puts a student in a group and creates the invoices (1 to 12 installments).
// Returns { enrollment, invoices, group: { capacity, enrolledCount } } so the route can warn when the group is almost full.
const enrollStudent = async (
  { studentId, groupId, fee, discount = 0, discountReason, installments = 1, firstDueDate, force = false, notes },
  userId,
) => {
  const [student, group] = await Promise.all([
    studentsCollection.findById(studentId).lean(),
    groupsCollection.findById(groupId).populate('program', 'name levels').lean(),
  ]);
  if (!student) throw notFound('Student not found');
  if (!group) throw notFound('Group not found');
  if (['completed', 'cancelled'].includes(group.status)) throw badRequest(`This group is ${group.status}`);
  if (await enrollmentsCollection.exists({ student: studentId, group: groupId, status: 'active' })) {
    throw conflict('The student is already in this group');
  }
  const enrolledCount = await enrollmentsCollection.countDocuments({ group: groupId, status: 'active' });
  if (enrolledCount >= group.capacity && !force) throw conflict(`The group is full (${enrolledCount}/${group.capacity})`);

  const level = group.program.levels.find((l) => l.number === group.levelNumber);
  const grossFee = Number(fee ?? group.fee ?? level?.fee ?? 0);
  const netFee = Math.max(0, grossFee - Number(discount || 0));

  const enrollment = await enrollmentsCollection.create({
    student: studentId,
    group: groupId,
    program: group.program._id,
    levelNumber: group.levelNumber,
    campus: group.campus,
    fee: grossFee,
    discount: Number(discount || 0),
    discountReason,
    notes,
    createdBy: userId,
  });

  const invoices = [];
  if (netFee > 0) {
    const due = firstDueDate ? new Date(firstDueDate) : new Date();
    for (const part of buildInstallments(netFee, installments, due)) {
      const label = `${group.program.name} · Level ${group.levelNumber}${part.installment.count > 1 ? ` (${part.installment.index}/${part.installment.count})` : ''}`;
      invoices.push(
        (
          await invoicesCollection.create({
            ...part,
            label,
            number: await generateNumber('INV'),
            student: studentId,
            enrollment: enrollment._id,
            campus: group.campus,
            createdBy: userId,
          })
        ).toObject(),
      );
    }
  }

  // The student is now placed: they leave the waiting list.
  await studentsCollection.updateOne(
    { _id: studentId },
    { $set: { status: 'active' }, $unset: { desiredProgram: 1, desiredLevel: 1 } },
  );

  return {
    enrollment: enrollment.toObject(),
    invoices,
    group: { _id: group._id, name: group.name, capacity: group.capacity, enrolledCount: enrolledCount + 1, campus: group.campus },
  };
};

export default enrollStudent;
