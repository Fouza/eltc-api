import dayjs from 'dayjs';

// Attendance sheets are stored per calendar day at 00:00 UTC.
export const toDay = (d) => {
  const s = dayjs(d).format('YYYY-MM-DD');
  return new Date(`${s}T00:00:00.000Z`);
};

export const startOfToday = () => toDay(new Date());

export const addMonths = (d, n) => dayjs(d).add(n, 'month').toDate();
export const addDays = (d, n) => new Date(new Date(d).getTime() + n * 24 * 3600 * 1000);
// Course payments come in blocks of 4 weeks: a block has 28 days to be paid.
export const BLOCK_DAYS = 28;

// Overdue = unpaid and its overdueAt date has passed (stored on each invoice, see invoiceSchema).
// Course blocks: the first day of the next 4-week block. Books: the end of the level.
export const isOverdueFilter = () => ({ status: { $in: ['unpaid', 'partial'] }, overdueAt: { $lt: startOfToday() } });
export const isOverdue = (i) => ['unpaid', 'partial'].includes(i.status) && i.overdueAt < startOfToday();
