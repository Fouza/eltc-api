import dayjs from 'dayjs';

// Attendance sheets are stored per calendar day at 00:00 UTC.
export const toDay = (d) => {
  const s = dayjs(d).format('YYYY-MM-DD');
  return new Date(`${s}T00:00:00.000Z`);
};

export const startOfToday = () => toDay(new Date());

export const addMonths = (d, n) => dayjs(d).add(n, 'month').toDate();
