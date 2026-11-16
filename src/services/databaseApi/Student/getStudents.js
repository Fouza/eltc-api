import mongoose from 'mongoose';
import { studentsCollection, enrollmentsCollection, invoicesCollection } from '../../../models/index.js';
import { getPagination, paginated } from '../../../helpers/pagination.js';
import { campusFilter } from '../../../helpers/campusScope.js';
import { startOfToday } from '../../../helpers/dates.js';
import buildStudentSearch from './buildStudentSearch.js';
import getStudentBalances from './getStudentBalances.js';

const oid = (id) => new mongoose.Types.ObjectId(String(id));

// Filters: q, status, campus, program, level, group, overdue=1. Each row gets its current groups and balance.
const getStudents = async (query, user) => {
  const filter = { ...campusFilter(user, query.campus), ...buildStudentSearch(query.q) };
  if (query.status) filter.status = { $in: String(query.status).split(',') };

  if (query.group || query.program) {
    const eFilter = { status: 'active' };
    if (query.group) eFilter.group = oid(query.group);
    if (query.program) eFilter.program = oid(query.program);
    if (query.level) eFilter.levelNumber = Number(query.level);
    filter._id = { $in: await enrollmentsCollection.distinct('student', eFilter) };
  }
  if (query.overdue === '1' || query.overdue === 'true') {
    const ids = await invoicesCollection.distinct('student', { status: { $in: ['unpaid', 'partial'] }, dueDate: { $lt: startOfToday() } });
    filter._id = filter._id ? { $in: filter._id.$in.filter((id) => ids.some((x) => String(x) === String(id))) } : { $in: ids };
  }

  const pagination = getPagination(query);
  const sort = query.sort === 'name' ? { lastName: 1, firstName: 1 } : { registeredAt: -1, _id: -1 };
  const [items, total] = await Promise.all([
    studentsCollection
      .find(filter)
      .populate('campus', 'name code color')
      .populate('desiredProgram', 'name')
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    studentsCollection.countDocuments(filter),
  ]);

  const ids = items.map((s) => s._id);
  const [balances, enrollments] = await Promise.all([
    getStudentBalances(ids),
    enrollmentsCollection
      .find({ student: { $in: ids }, status: 'active' })
      .populate({ path: 'group', select: 'name levelNumber program', populate: { path: 'program', select: 'name color' } })
      .lean(),
  ]);
  const groupsBy = {};
  enrollments.forEach((e) => {
    (groupsBy[String(e.student)] ??= []).push({ _id: e.group?._id, name: e.group?.name, levelNumber: e.levelNumber, program: e.group?.program });
  });

  return paginated(
    items.map((s) => ({
      ...s,
      groups: groupsBy[String(s._id)] ?? [],
      balance: balances[String(s._id)]?.due ?? 0,
      overdue: balances[String(s._id)]?.overdue ?? 0,
    })),
    total,
    pagination,
  );
};

export default getStudents;
