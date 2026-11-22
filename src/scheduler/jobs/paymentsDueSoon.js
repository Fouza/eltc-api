import { CronJob } from 'cron';
import dayjs from 'dayjs';
import * as databaseApi from '../../services/databaseApi/index.js';
import { invoicesCollection } from '../../models/index.js';
import notify from '../../services/notifications/notify.js';
import { ROLES } from '../../constants/roles.js';
import { startOfToday } from '../../helpers/dates.js';

// One daily digest: how many installments fall due in the next 3 days.
export const runPaymentsDueSoon = async () => {
  const settings = await databaseApi.getSettings();
  const today = startOfToday();
  const rows = await invoicesCollection.aggregate([
    { $match: { status: { $in: ['unpaid', 'partial'] }, dueDate: { $gte: today, $lte: dayjs(today).add(3, 'day').toDate() } } },
    { $group: { _id: '$campus', count: { $sum: 1 }, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } },
  ]);
  for (const r of rows) {
    await notify({
      type: 'payments_due_soon',
      severity: 'info',
      title: `${r.count} payment${r.count > 1 ? 's' : ''} due in the next 3 days`,
      message: `${r.total.toLocaleString('fr-FR')} ${settings.currency} expected. A good time to remind students.`,
      link: '/payments?tab=invoices&status=open',
      campus: r._id,
      roles: [ROLES.SECRETARY],
      dedupeKey: `due_soon:${r._id}:${dayjs(today).format('YYYY-MM-DD')}`,
    });
  }
  return { campuses: rows.length };
};

export default new CronJob('0 8 * * *', runPaymentsDueSoon, null, false, 'UTC');
