import { studentsCollection } from '../../../models/index.js';
import { campusFilter } from '../../../helpers/campusScope.js';

// Prospects grouped by (program, level, campus): helps decide when to open a new group.
const getWaitingList = async (query, user) => {
  const students = await studentsCollection
    .find({ status: 'prospect', ...campusFilter(user, query.campus) })
    .populate('campus', 'name code color')
    .populate({ path: 'desiredProgram', select: 'name audience language color', populate: { path: 'language', select: 'name code color' } })
    .sort({ registeredAt: 1 })
    .lean();

  const buckets = {};
  for (const s of students) {
    const key = `${s.desiredProgram?._id ?? 'none'}-${s.desiredLevel ?? 0}-${s.campus?._id}`;
    buckets[key] ??= { key, program: s.desiredProgram ?? null, levelNumber: s.desiredLevel ?? null, campus: s.campus, students: [] };
    buckets[key].students.push({
      _id: s._id, firstName: s.firstName, lastName: s.lastName, phone: s.phone, registeredAt: s.registeredAt,
      preferredSlots: s.preferredSlots, studentNumber: s.studentNumber,
    });
  }
  return Object.values(buckets).sort((a, b) => b.students.length - a.students.length);
};

export default getWaitingList;
