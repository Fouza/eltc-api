import { teachersCollection, groupsCollection } from '../../../models/index.js';

// Each teacher comes with the number of groups they currently teach.
const getTeachers = async (filter = {}) => {
  const teachers = await teachersCollection
    .find(filter)
    .populate('languages', 'name code color')
    .populate('campusIds', 'name code color')
    .sort({ active: -1, lastName: 1 })
    .lean();
  const counts = await groupsCollection.aggregate([
    { $match: { teacher: { $in: teachers.map((t) => t._id) }, status: { $in: ['planned', 'ongoing'] } } },
    { $group: { _id: '$teacher', count: { $sum: 1 } } },
  ]);
  const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  return teachers.map((t) => ({ ...t, activeGroups: byId[String(t._id)] ?? 0 }));
};

export default getTeachers;
