import dayjs from 'dayjs';
import mongoose from 'mongoose';
import { attendancesCollection, enrollmentsCollection } from '../../../models/index.js';

const oid = (id) => new mongoose.Types.ObjectId(String(id));

// Students with at least `threshold` absences in the last `days` days, in a group they are still in.
// groupId / studentIds narrow the check (used right after an attendance sheet is saved).
const getLowAttendance = async ({ threshold = 3, days = 30, campusMatch = {}, groupId, studentIds } = {}) => {
  const rows = await attendancesCollection.aggregate([
    { $match: { date: { $gte: dayjs().subtract(days, 'day').toDate() }, ...campusMatch, ...(groupId ? { group: oid(groupId) } : {}) } },
    { $unwind: '$entries' },
    { $match: { 'entries.status': 'absent', ...(studentIds ? { 'entries.student': { $in: studentIds.map(oid) } } : {}) } },
    { $group: { _id: { student: '$entries.student', group: '$group' }, absences: { $sum: 1 }, last: { $max: '$date' }, campus: { $first: '$campus' } } },
    { $match: { absences: { $gte: threshold } } },
    { $lookup: { from: 'students', localField: '_id.student', foreignField: '_id', as: 'student', pipeline: [{ $project: { firstName: 1, lastName: 1, phone: 1, guardian: 1 } }] } },
    { $lookup: { from: 'groups', localField: '_id.group', foreignField: '_id', as: 'group', pipeline: [{ $project: { name: 1 } }] } },
    { $unwind: '$student' },
    { $unwind: '$group' },
    { $sort: { absences: -1 } },
  ]);
  if (!rows.length) return []; // MongoDB rejects an empty $or
  const active = await enrollmentsCollection
    .find({ status: 'active', $or: rows.map((r) => ({ student: r._id.student, group: r._id.group })) }, { student: 1, group: 1 })
    .lean();
  const activeKeys = new Set(active.map((e) => `${e.student}-${e.group}`));
  return rows.filter((r) => activeKeys.has(`${r._id.student}-${r._id.group}`));
};

export default getLowAttendance;
