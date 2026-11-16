import mongoose from 'mongoose';
import { invoicesCollection } from '../../../models/index.js';
import { campusFilter } from '../../../helpers/campusScope.js';
import { getPagination, paginated } from '../../../helpers/pagination.js';
import { startOfToday } from '../../../helpers/dates.js';

// status: unpaid | partial | paid | cancelled | open (unpaid+partial) | overdue
export const buildInvoiceFilter = (query, user) => {
  const filter = { ...campusFilter(user, query.campus) };
  const today = startOfToday();
  if (query.status === 'overdue') Object.assign(filter, { status: { $in: ['unpaid', 'partial'] }, dueDate: { $lt: today } });
  else if (query.status === 'open') filter.status = { $in: ['unpaid', 'partial'] };
  else if (query.status) filter.status = query.status;
  if (query.student) filter.student = new mongoose.Types.ObjectId(String(query.student));
  if (query.from || query.to) {
    filter.dueDate = { ...filter.dueDate };
    if (query.from) filter.dueDate.$gte = new Date(query.from);
    if (query.to) filter.dueDate.$lte = new Date(query.to);
  }
  return filter;
};

const getInvoices = async (query, user) => {
  const filter = buildInvoiceFilter(query, user);
  const pagination = getPagination(query, 50);
  const today = startOfToday();
  const [items, total, [totals]] = await Promise.all([
    invoicesCollection
      .find(filter)
      .populate('student', 'firstName lastName studentNumber phone guardian')
      .populate('campus', 'name code color')
      .populate({ path: 'enrollment', select: 'group levelNumber', populate: { path: 'group', select: 'name' } })
      .sort(query.status === 'paid' ? { updatedAt: -1 } : { dueDate: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    invoicesCollection.countDocuments(filter),
    invoicesCollection.aggregate([
      { $match: filter },
      { $group: { _id: null, amount: { $sum: '$amount' }, paid: { $sum: '$paidAmount' } } },
    ]),
  ]);
  return {
    ...paginated(
      items.map((i) => ({ ...i, isOverdue: ['unpaid', 'partial'].includes(i.status) && i.dueDate < today })),
      total,
      pagination,
    ),
    totals: { amount: totals?.amount ?? 0, paid: totals?.paid ?? 0, remaining: (totals?.amount ?? 0) - (totals?.paid ?? 0) },
  };
};

export default getInvoices;
