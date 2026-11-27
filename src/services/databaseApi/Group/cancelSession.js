import { attendancesCollection, groupsCollection, invoicesCollection } from '../../../models/index.js';
import { badRequest, conflict, notFound } from '../../../helpers/errors.js';
import { toDay } from '../../../helpers/dates.js';
import { sessionProblem, stepSession } from '../../../helpers/classDays.js';
import { SESSION_CANCEL_REASONS } from '../../../constants/enums.js';
import getGroupById from './getGroupById.js';

// Moves the group's invoice dates and end date one session later (dir 1) or back (dir -1) around a cancelled day.
// A block is a number of sessions (4 for kids, 8 or 12 for adults): a session that doesn't happen pushes it back.
export const shiftGroupDates = async (group, day, dir) => {
  const moves = (d) => d && (dir > 0 ? toDay(d) >= day : toDay(d) > day);
  const invoices = await invoicesCollection.find({ group: group._id, status: { $ne: 'cancelled' } }, { dueDate: 1, overdueAt: 1 }).lean();
  const ops = invoices
    .filter((i) => moves(i.dueDate) || moves(i.overdueAt))
    .map((i) => ({
      updateOne: {
        filter: { _id: i._id },
        update: { $set: { ...(moves(i.dueDate) ? { dueDate: stepSession(group, i.dueDate, dir) } : {}), ...(moves(i.overdueAt) ? { overdueAt: stepSession(group, i.overdueAt, dir) } : {}) } },
      },
    }));
  if (ops.length) await invoicesCollection.bulkWrite(ops);
  if (moves(group.endDate)) await groupsCollection.updateOne({ _id: group._id }, { $set: { endDate: stepSession(group, group.endDate, dir) } });
  return ops.length;
};

// Cancels one session of one group (so only that group's campus). Holidays and Eid are cancelled group by group.
const cancelSession = async (groupId, { date, reason, note }, userId) => {
  const group = await groupsCollection.findById(groupId).lean();
  if (!group) throw notFound('Group not found');
  if (!date) throw badRequest('Choose the date');
  if (!SESSION_CANCEL_REASONS.includes(reason)) throw badRequest('Choose a reason');
  const day = toDay(date);
  const problem = sessionProblem(group, day);
  if (problem) throw badRequest(problem);
  if (await attendancesCollection.exists({ group: groupId, date: day })) throw conflict('Attendance was already taken for this session: delete the sheet first');
  await groupsCollection.updateOne({ _id: groupId }, { $push: { cancelledSessions: { date: day, reason, note, cancelledBy: userId } } });
  const moved = await shiftGroupDates(group, day, 1);
  return { group: await getGroupById(groupId), invoicesMoved: moved };
};

export default cancelSession;
