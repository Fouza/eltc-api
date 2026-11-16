import { paymentsCollection } from '../../../models/index.js';
import mongoose from 'mongoose';
import { campusFilter } from '../../../helpers/campusScope.js';
import { getPagination, paginated } from '../../../helpers/pagination.js';

const getPayments = async (query, user) => {
  const filter = { ...campusFilter(user, query.campus) };
  if (query.method) filter.method = query.method;
  if (query.student) filter.student = new mongoose.Types.ObjectId(String(query.student));
  if (query.from || query.to) {
    filter.paidAt = {};
    if (query.from) filter.paidAt.$gte = new Date(query.from);
    if (query.to) filter.paidAt.$lte = new Date(`${query.to}T23:59:59.999Z`);
  }
  const pagination = getPagination(query, 50);
  const [items, total, byMethod] = await Promise.all([
    paymentsCollection
      .find(filter)
      .populate('student', 'firstName lastName studentNumber')
      .populate('invoice', 'number label')
      .populate('campus', 'name code color')
      .populate('receivedBy', 'firstName lastName')
      .sort({ paidAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    paymentsCollection.countDocuments(filter),
    paymentsCollection.aggregate([{ $match: filter }, { $group: { _id: '$method', amount: { $sum: '$amount' }, count: { $sum: 1 } } }]),
  ]);
  return {
    ...paginated(items, total, pagination),
    totals: { amount: byMethod.reduce((s, m) => s + m.amount, 0), byMethod },
  };
};

export default getPayments;
