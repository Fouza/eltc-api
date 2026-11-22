import { CronJob } from 'cron';
import dayjs from 'dayjs';
import * as databaseApi from '../../services/databaseApi/index.js';
import notify from '../../services/notifications/notify.js';
import { ROLES } from '../../constants/roles.js';
import { fullName } from '../../helpers/strings.js';

// One alert per overdue invoice (deduplicated), for admin and secretary.
export const runOverduePayments = async () => {
  const settings = await databaseApi.getSettings();
  const invoices = await databaseApi.getOverdueInvoices();
  let created = 0;
  for (const inv of invoices) {
    const remaining = inv.amount - inv.paidAmount;
    const days = dayjs().diff(inv.dueDate, 'day');
    const n = await notify({
      type: 'payment_overdue',
      severity: days > 30 ? 'danger' : 'warning',
      title: `Overdue payment: ${fullName(inv.student)}`,
      message: `${inv.label}: ${remaining.toLocaleString('fr-FR')} ${settings.currency} due since ${dayjs(inv.dueDate).format('D MMM YYYY')} (${days} days).`,
      link: `/students/${inv.student?._id}?tab=payments`,
      campus: inv.campus,
      roles: [ROLES.SECRETARY],
      dedupeKey: `overdue:${inv._id}`,
    });
    if (n) created++;
  }
  return { checked: invoices.length, created };
};

export default new CronJob('0 7 * * *', runOverduePayments, null, false, 'UTC'); // every day 07:00
