import { attendancesCollection, groupsCollection } from '../../../models/index.js';
import { badRequest, notFound } from '../../../helpers/errors.js';
import { sessionProblem } from '../../../helpers/classDays.js';
import { toDay } from '../../../helpers/dates.js';

const saveAttendanceSheet = async ({ groupId, date, topic, entries = [] }, userId) => {
  const group = await groupsCollection.findById(groupId, { campus: 1, teacher: 1, schedule: 1, startDate: 1, endDate: 1, cancelledSessions: 1 }).lean();
  if (!group) throw notFound('Group not found');
  // No sheet outside the group's dates, on a day without class or on a cancelled session.
  const problem = sessionProblem(group, date);
  if (problem) throw badRequest(problem);
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
