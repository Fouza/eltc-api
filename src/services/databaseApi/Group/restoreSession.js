import { groupsCollection } from '../../../models/index.js';
import { notFound } from '../../../helpers/errors.js';
import { toDay } from '../../../helpers/dates.js';
import { isCancelledSession } from '../../../helpers/classDays.js';
import getGroupById from './getGroupById.js';
import { shiftGroupDates } from './cancelSession.js';

// Undoes a cancellation: the session takes place again, the dates move back one session.
const restoreSession = async (groupId, date) => {
  const group = await groupsCollection.findById(groupId).lean();
  if (!group) throw notFound('Group not found');
  const day = toDay(date);
  if (!isCancelledSession(group, day)) throw notFound('This session is not cancelled');
  await groupsCollection.updateOne({ _id: groupId }, { $pull: { cancelledSessions: { date: day } } });
  const after = await groupsCollection.findById(groupId).lean();
  const moved = await shiftGroupDates(after, day, -1);
  return { group: await getGroupById(groupId), invoicesMoved: moved };
};

export default restoreSession;
