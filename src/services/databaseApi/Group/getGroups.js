import { groupsCollection, enrollmentsCollection } from '../../../models/index.js';

const POPULATE = [
  { path: 'program', select: 'name audience levels color language', populate: { path: 'language', select: 'name code color' } },
  { path: 'campus', select: 'name code color' },
  { path: 'teacher', select: 'firstName lastName phone' },
];

// Adds enrolledCount and the level details to each group.
export const withGroupStats = async (groups) => {
  const counts = await enrollmentsCollection.aggregate([
    { $match: { group: { $in: groups.map((g) => g._id) }, status: 'active' } },
    { $group: { _id: '$group', count: { $sum: 1 } } },
  ]);
  const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  return groups.map((g) => {
    const level = g.program?.levels?.find((l) => l.number === g.levelNumber);
    const { levels, ...program } = g.program ?? {};
    return { ...g, program: { ...program, levelsCount: levels?.length ?? 0 }, level, enrolledCount: byId[String(g._id)] ?? 0 };
  });
};

const getGroups = async (filter = {}, sort = { status: 1, startDate: -1 }) => {
  const groups = await groupsCollection.find(filter).populate(POPULATE).sort(sort).lean();
  return withGroupStats(groups);
};

export { POPULATE as groupPopulate };
export default getGroups;
