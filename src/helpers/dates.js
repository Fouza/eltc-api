import dayjs from 'dayjs';

// Attendance sheets are stored per calendar day at 00:00 UTC.
export const toDay = (d) => {
  const s = dayjs(d).format('YYYY-MM-DD');
  return new Date(`${s}T00:00:00.000Z`);
};

export const startOfToday = () => toDay(new Date());

export const addMonths = (d, n) => dayjs(d).add(n, 'month').toDate();

// Overdue = unpaid and its overdueAt date has passed (stored on each invoice, see invoiceSchema).
// Course months: one month after the due date. Books: the end of the level.
export const isOverdueFilter = () => ({ status: { $in: ['unpaid', 'partial'] }, overdueAt: { $lt: startOfToday() } });
export const isOverdue = (i) => ['unpaid', 'partial'].includes(i.status) && i.overdueAt < startOfToday();
