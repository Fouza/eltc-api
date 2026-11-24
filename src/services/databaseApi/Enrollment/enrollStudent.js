import dayjs from 'dayjs';
import { enrollmentsCollection, groupsCollection, studentsCollection, invoicesCollection } from '../../../models/index.js';
import { badRequest, conflict, notFound } from '../../../helpers/errors.js';
import generateNumber from '../Counter/generateNumber.js';
import buildInstallments from '../Invoice/buildInstallments.js';
import buildMonthlyPlan from '../Invoice/buildMonthlyPlan.js';
import { levelLabel } from '../../../constants/enums.js';
import { toDay } from '../../../helpers/dates.js';
import getBooksForLevel from '../Book/getBooksForLevel.js';

// Puts a student in a group and creates the invoices.
// plan 'monthly' (default): the fee split by the level's months, due at the start of each month (see buildMonthlyPlan).
// plan 'custom': a hand-made split, 1 to 12 installments a month apart from firstDueDate.
// Books: one invoice per book of the level (all of them unless `books` lists the ids to charge), no discount,
// due on enrollment and overdue at the end of the level.
// Returns { enrollment, invoices, group: { capacity, enrolledCount } } so the route can warn when the group is almost full.
const enrollStudent = async (
  { studentId, groupId, fee, discount = 0, discountReason, plan = 'monthly', installments = 1, firstDueDate, enrolledAt, books, force = false, notes },
  userId,
) => {
  const [student, group] = await Promise.all([
    studentsCollection.findById(studentId).lean(),
    groupsCollection.findById(groupId).populate('program', 'name levels audience').lean(),
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
    ...(enrolledAt ? { enrolledAt } : {}),
  });

  const invoices = [];
  if (netFee > 0) {
    const weeks = level?.durationWeeks ?? (group.startDate && group.endDate ? dayjs(group.endDate).diff(group.startDate, 'week') : 0);
    const parts = plan === 'custom'
      ? buildInstallments(netFee, installments, firstDueDate ? new Date(firstDueDate) : new Date())
      : buildMonthlyPlan({ total: netFee, weeks, startDate: group.startDate, joinDate: enrolledAt ?? new Date() });
    const levelName = levelLabel(group.levelNumber, group.program.levels, group.program.audience);
    for (const { share, ...part } of parts) {
      const { index, count, fromWeek, toWeek } = part.installment;
      // "· weeks 5–8" for a 4-week block; one block covering the whole level needs no suffix.
      const whole = count <= 1 && share >= 1;
      const suffix = plan === 'custom' ? (count <= 1 ? '' : ` (${index}/${count})`) : whole ? '' : fromWeek === toWeek ? ` · week ${fromWeek}` : ` · weeks ${fromWeek}–${toWeek}`;
      const label = `${group.program.name} · ${levelName}${suffix}`;
      invoices.push(
        (
          await invoicesCollection.create({
            ...part,
            label,
            kind: 'course',
            number: await generateNumber('INV'),
            student: studentId,
            enrollment: enrollment._id,
            group: group._id,
            campus: group.campus,
            createdBy: userId,
          })
        ).toObject(),
      );
    }
  }

  const levelEnd = group.endDate ?? dayjs(group.startDate ?? enrolledAt ?? new Date()).add(level?.durationWeeks ?? 12, 'week').toDate();
  const levelBooks = (await getBooksForLevel(group.program._id, group.levelNumber)).filter((b) => !books || books.map(String).includes(String(b._id)));
  for (const book of levelBooks.filter((b) => b.price > 0)) {
    invoices.push(
      (
        await invoicesCollection.create({
          label: book.title,
          kind: 'book',
          book: book._id,
          amount: book.price,
          dueDate: toDay(enrolledAt ?? new Date()),
          overdueAt: levelEnd,
          number: await generateNumber('INV'),
          student: studentId,
          enrollment: enrollment._id,
          group: group._id,
          campus: group.campus,
          createdBy: userId,
        })
      ).toObject(),
    );
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
