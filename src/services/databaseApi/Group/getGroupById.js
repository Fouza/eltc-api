import mongoose from 'mongoose';
import { groupsCollection, invoicesCollection, attendancesCollection } from '../../../models/index.js';
import { groupPopulate } from './getGroups.js';
import getGroupRoster from './getGroupRoster.js';
import { withGroupStats } from './getGroups.js';
import { startOfToday } from '../../../helpers/dates.js';

// Group + roster, where each student has their balance, overdue amount and attendance rate in this group.
const getGroupById = async (id) => {
  const raw = await groupsCollection.findById(id).populate(groupPopulate).lean();
  if (!raw) return null;
  const [group] = await withGroupStats([raw]);
  const roster = await getGroupRoster(id, ['active', 'completed', 'transferred', 'dropped']);
  const enrollmentIds = roster.map((e) => e._id);
  const studentIds = roster.map((e) => e.student._id);

  const [balances, attendance] = await Promise.all([
    invoicesCollection.aggregate([
      { $match: { enrollment: { $in: enrollmentIds }, status: { $in: ['unpaid', 'partial'] } } },
      {
        $group: {
          _id: '$enrollment',
          due: { $sum: { $subtract: ['$amount', '$paidAmount'] } },
          overdue: { $sum: { $cond: [{ $lt: ['$dueDate', startOfToday()] }, { $subtract: ['$amount', '$paidAmount'] }, 0] } },
        },
      },
    ]),
    attendancesCollection.aggregate([
      { $match: { group: new mongoose.Types.ObjectId(String(id)) } },
      { $unwind: '$entries' },
      { $match: { 'entries.student': { $in: studentIds } } },
      {
        $group: {
          _id: '$entries.student',
          total: { $sum: 1 },
          absent: { $sum: { $cond: [{ $eq: ['$entries.status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$entries.status', 'late'] }, 1, 0] } },
        },
      },
    ]),
  ]);
  const balanceBy = Object.fromEntries(balances.map((b) => [String(b._id), b]));
  const attBy = Object.fromEntries(attendance.map((a) => [String(a._id), a]));
  const sessions = await attendancesCollection.countDocuments({ group: id });

  return {
    ...group,
    sessions,
    roster: roster.map((e) => {
      const att = attBy[String(e.student._id)];
      return {
        ...e,
        balance: balanceBy[String(e._id)]?.due ?? 0,
        overdue: balanceBy[String(e._id)]?.overdue ?? 0,
        attendance: att ? { ...att, rate: att.total ? Math.round(((att.total - att.absent) / att.total) * 100) : null } : null,
      };
    }),
  };
};

export default getGroupById;
