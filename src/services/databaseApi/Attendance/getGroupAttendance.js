import { attendancesCollection } from '../../../models/index.js';

// All sheets of a group (for the attendance matrix on the group page).
const getGroupAttendance = (groupId) =>
  attendancesCollection.find({ group: groupId }, { date: 1, topic: 1, entries: 1 }).sort({ date: 1 }).lean();

export default getGroupAttendance;
