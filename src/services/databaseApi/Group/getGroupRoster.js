import { enrollmentsCollection } from '../../../models/index.js';

// Enrollments of a group with the student, sorted by last name.
const getGroupRoster = async (groupId, statuses = ['active']) => {
  const roster = await enrollmentsCollection
    .find({ group: groupId, status: { $in: statuses } })
    .populate('student', 'firstName lastName studentNumber phone phone2 guardian birthDate status')
    .lean();
  return roster
    .filter((e) => e.student)
    .sort((a, b) => `${a.student.lastName} ${a.student.firstName}`.localeCompare(`${b.student.lastName} ${b.student.firstName}`));
};

export default getGroupRoster;
