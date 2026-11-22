import dayjs from 'dayjs';
import {
  studentsCollection, groupsCollection, enrollmentsCollection, invoicesCollection, paymentsCollection, attendancesCollection, examsCollection,
} from '../../../models/index.js';
import { campusFilter } from '../../../helpers/campusScope.js';
import { isOverdueFilter, startOfToday } from '../../../helpers/dates.js';
import { CAN } from '../../../constants/roles.js';
import getGroups from '../Group/getGroups.js';

const sum = async (collection, match, field) => {
  const [row] = await collection.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: field }, count: { $sum: 1 } } }]);
  return { total: row?.total ?? 0, count: row?.count ?? 0 };
};

const getDashboardSummary = async (user, query = {}) => {
  const scope = campusFilter(user, query.campus);
  const today = startOfToday();
  const monthStart = dayjs().startOf('month').toDate();
  const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();
  const since30 = dayjs().subtract(30, 'day').toDate();
  const showFinance = user.roles.some((r) => CAN.viewFinance.includes(r));

  const [activeStudents, prospects, newThisMonth, ongoingGroups, plannedGroups] = await Promise.all([
    studentsCollection.countDocuments({ ...scope, status: 'active' }),
    studentsCollection.countDocuments({ ...scope, status: 'prospect' }),
    studentsCollection.countDocuments({ ...scope, registeredAt: { $gte: monthStart } }),
    groupsCollection.countDocuments({ ...scope, status: 'ongoing' }),
    groupsCollection.countDocuments({ ...scope, status: 'planned' }),
  ]);

  // Attendance rate over the last 30 days.
  const [att] = await attendancesCollection.aggregate([
    { $match: { ...scope, date: { $gte: since30 } } },
    { $unwind: '$entries' },
    { $group: { _id: null, total: { $sum: 1 }, absent: { $sum: { $cond: [{ $eq: ['$entries.status', 'absent'] }, 1, 0] } } } },
  ]);

  // Students per language / per campus (active enrollments).
  const [byLanguage, byCampus, byAudience] = await Promise.all([
    enrollmentsCollection.aggregate([
      { $match: { ...scope, status: 'active' } },
      { $lookup: { from: 'programs', localField: 'program', foreignField: '_id', as: 'p', pipeline: [{ $project: { language: 1 } }] } },
      { $unwind: '$p' },
      { $group: { _id: '$p.language', students: { $addToSet: '$student' } } },
      { $lookup: { from: 'languages', localField: '_id', foreignField: '_id', as: 'l' } },
      { $unwind: '$l' },
      { $project: { name: '$l.name', color: '$l.color', count: { $size: '$students' } } },
      { $sort: { count: -1 } },
    ]),
    enrollmentsCollection.aggregate([
      { $match: { ...scope, status: 'active' } },
      { $group: { _id: '$campus', students: { $addToSet: '$student' } } },
      { $lookup: { from: 'campuses', localField: '_id', foreignField: '_id', as: 'c' } },
      { $unwind: '$c' },
      { $project: { name: '$c.name', color: '$c.color', count: { $size: '$students' } } },
      { $sort: { count: -1 } },
    ]),
    enrollmentsCollection.aggregate([
      { $match: { ...scope, status: 'active' } },
      { $lookup: { from: 'programs', localField: 'program', foreignField: '_id', as: 'p', pipeline: [{ $project: { audience: 1 } }] } },
      { $unwind: '$p' },
      { $group: { _id: '$p.audience', students: { $addToSet: '$student' } } },
      { $project: { name: '$_id', count: { $size: '$students' } } },
    ]),
  ]);

  // Today's classes.
  const weekday = dayjs().day();
  const todayGroups = (await getGroups({ ...scope, status: 'ongoing', 'schedule.day': weekday }))
    .map((g) => ({ ...g, slot: g.schedule.find((s) => s.day === weekday) }))
    .sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));

  const upcomingExams = await examsCollection
    .find({ ...scope, date: { $gte: today, $lte: dayjs().add(14, 'day').toDate() } }, { results: 0 })
    .populate('group', 'name')
    .sort({ date: 1 })
    .limit(6)
    .lean();

  const recentStudents = await studentsCollection
    .find(scope, { firstName: 1, lastName: 1, studentNumber: 1, status: 1, registeredAt: 1, campus: 1 })
    .populate('campus', 'name code color')
    .sort({ registeredAt: -1 })
    .limit(6)
    .lean();

  const summary = {
    students: { active: activeStudents, prospects, newThisMonth },
    groups: { ongoing: ongoingGroups, planned: plannedGroups },
    attendance: { rate: att?.total ? Math.round(((att.total - att.absent) / att.total) * 100) : null, sessions: att?.total ?? 0 },
    byLanguage,
    byCampus,
    byAudience,
    todayGroups,
    upcomingExams,
    recentStudents,
  };
  if (!showFinance) return summary;

  const open = { ...scope, status: { $in: ['unpaid', 'partial'] } };
  const [thisMonth, lastMonth, outstanding, overdue] = await Promise.all([
    sum(paymentsCollection, { ...scope, paidAt: { $gte: monthStart } }, '$amount'),
    sum(paymentsCollection, { ...scope, paidAt: { $gte: lastMonthStart, $lt: monthStart } }, '$amount'),
    sum(invoicesCollection, open, { $subtract: ['$amount', '$paidAmount'] }),
    sum(invoicesCollection, { ...open, ...isOverdueFilter() }, { $subtract: ['$amount', '$paidAmount'] }),
  ]);

  // Revenue (payments received) vs billed (invoices due) for the last 6 months.
  const from = dayjs().subtract(5, 'month').startOf('month').toDate();
  const [received, billed] = await Promise.all([
    paymentsCollection.aggregate([
      { $match: { ...scope, paidAt: { $gte: from } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } }, total: { $sum: '$amount' } } },
    ]),
    invoicesCollection.aggregate([
      { $match: { ...scope, status: { $ne: 'cancelled' }, dueDate: { $gte: from, $lte: dayjs().endOf('month').toDate() } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$dueDate' } }, total: { $sum: '$amount' } } },
    ]),
  ]);
  const months = Array.from({ length: 6 }, (_, i) => dayjs(from).add(i, 'month').format('YYYY-MM'));
  const rec = Object.fromEntries(received.map((r) => [r._id, r.total]));
  const bil = Object.fromEntries(billed.map((r) => [r._id, r.total]));

  const overdueInvoices = await invoicesCollection
    .find({ ...open, ...isOverdueFilter() })
    .populate('student', 'firstName lastName phone studentNumber')
    .sort({ dueDate: 1 })
    .limit(6)
    .lean();

  return {
    ...summary,
    finance: {
      revenueThisMonth: thisMonth.total,
      revenueLastMonth: lastMonth.total,
      paymentsThisMonth: thisMonth.count,
      outstanding: outstanding.total,
      overdue: overdue.total,
      overdueCount: overdue.count,
      revenueByMonth: months.map((m) => ({ month: m, received: rec[m] ?? 0, billed: bil[m] ?? 0 })),
      overdueInvoices,
    },
  };
};

export default getDashboardSummary;
