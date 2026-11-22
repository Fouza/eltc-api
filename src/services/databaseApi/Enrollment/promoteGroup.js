import { enrollmentsCollection, groupsCollection } from '../../../models/index.js';
import { badRequest, notFound } from '../../../helpers/errors.js';
import enrollStudent from './enrollStudent.js';

// End of level: the selected students (by default those who passed) move to the next-level group,
// invoiced with the monthly plan of the new level.
const promoteGroup = async (groupId, { targetGroupId, studentIds }, userId) => {
  const [group, target] = await Promise.all([groupsCollection.findById(groupId).lean(), groupsCollection.findById(targetGroupId).lean()]);
  if (!group || !target) throw notFound('Group not found');
  if (String(group.program) !== String(target.program)) throw badRequest('The target group must be in the same program');

  const filter = { group: groupId, status: { $in: ['active', 'completed'] } };
  if (studentIds?.length) filter.student = { $in: studentIds };
  else filter.finalResult = 'passed';
  const enrollments = await enrollmentsCollection.find(filter).lean();

  const report = { promoted: 0, skipped: [] };
  for (const e of enrollments) {
    try {
      await enrollStudent({ studentId: e.student, groupId: targetGroupId, force: true }, userId);
      await enrollmentsCollection.updateOne(
        { _id: e._id },
        { $set: { status: 'completed', endedAt: e.endedAt ?? new Date(), ...(e.finalResult === 'pending' ? { finalResult: 'passed' } : {}) } },
      );
      report.promoted++;
    } catch (err) {
      report.skipped.push({ student: e.student, error: err.message });
    }
  }
  return report;
};

export default promoteGroup;
