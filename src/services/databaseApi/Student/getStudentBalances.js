import { invoicesCollection } from '../../../models/index.js';
import { startOfToday } from '../../../helpers/dates.js';

// { [studentId]: { due, overdue } } for open invoices.
const getStudentBalances = async (studentIds) => {
  const rows = await invoicesCollection.aggregate([
    { $match: { student: { $in: studentIds }, status: { $in: ['unpaid', 'partial'] } } },
    {
      $group: {
        _id: '$student',
        due: { $sum: { $subtract: ['$amount', '$paidAmount'] } },
        overdue: { $sum: { $cond: [{ $lt: ['$overdueAt', startOfToday()] }, { $subtract: ['$amount', '$paidAmount'] }, 0] } },
      },
    },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), { due: r.due, overdue: r.overdue }]));
};

export default getStudentBalances;
