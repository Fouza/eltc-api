import { attendancesCollection, groupsCollection } from '../../../models/index.js';
import { notFound } from '../../../helpers/errors.js';
import { toDay } from '../../../helpers/dates.js';

const saveAttendanceSheet = async ({ groupId, date, topic, entries = [] }, userId) => {
  const group = await groupsCollection.findById(groupId, { campus: 1, teacher: 1 }).lean();
  if (!group) throw notFound('Group not found');
  const clean = entries
    .filter((e) => e.student)
    .map((e) => ({ student: e.student?._id ?? e.student, status: e.status ?? 'present', note: e.note || undefined }));
  return attendancesCollection
    .findOneAndUpdate(
      { group: groupId, date: toDay(date) },
      { $set: { campus: group.campus, teacher: group.teacher, topic, entries: clean, recordedBy: userId } },
      { upsert: true, returnDocument: 'after', runValidators: true },
    )
    .lean();
};

export default saveAttendanceSheet;
