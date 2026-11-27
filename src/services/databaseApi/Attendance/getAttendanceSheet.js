import { attendancesCollection, groupsCollection } from '../../../models/index.js';
import { notFound } from '../../../helpers/errors.js';
import { toDay } from '../../../helpers/dates.js';
import getGroupRoster from '../Group/getGroupRoster.js';
import { sessionProblem } from '../../../helpers/classDays.js';

// The sheet for a group on a date. If nothing was typed yet, returns the roster with everyone "present"
// so the secretary only clicks the exceptions from the teacher's paper list.
const getAttendanceSheet = async (groupId, date) => {
  const group = await groupsCollection.findById(groupId, { name: 1, campus: 1, teacher: 1, schedule: 1, startDate: 1, endDate: 1, cancelledSessions: 1 }).lean();
  if (!group) throw notFound('Group not found');
  const day = toDay(date);
  const [sheet, roster] = await Promise.all([
    attendancesCollection.findOne({ group: groupId, date: day }).populate('recordedBy', 'firstName lastName').lean(),
    getGroupRoster(groupId),
  ]);
  const byStudent = Object.fromEntries((sheet?.entries ?? []).map((e) => [String(e.student), e]));
  const students = roster.map((e) => e.student);
  // Keep students who left the group since, if they were on the sheet.
  const extra = (sheet?.entries ?? []).filter((e) => !students.some((s) => String(s._id) === String(e.student)));

  return {
    _id: sheet?._id ?? null,
    exists: Boolean(sheet),
    // Why there is no class that day (outside the group's dates, no class that weekday, cancelled). A saved sheet is still shown.
    noSession: sessionProblem(group, day),
    cancelled: (group.cancelledSessions ?? []).find((c) => toDay(c.date).getTime() === day.getTime()) ?? null,
    group,
    date: day,
    topic: sheet?.topic ?? '',
    recordedBy: sheet?.recordedBy ?? null,
    updatedAt: sheet?.updatedAt ?? null,
    entries: [
      ...students.map((s) => ({
        student: s,
        status: byStudent[String(s._id)]?.status ?? 'present',
        note: byStudent[String(s._id)]?.note ?? '',
      })),
      ...extra.map((e) => ({ student: { _id: e.student, firstName: '(left group)', lastName: '' }, status: e.status, note: e.note })),
    ],
  };
};

export default getAttendanceSheet;
