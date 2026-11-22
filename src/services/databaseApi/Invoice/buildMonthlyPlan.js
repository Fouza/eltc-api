import dayjs from 'dayjs';
import { addMonths, toDay } from '../../../helpers/dates.js';

// The school's rule: a level's fee is split by its length in months (4 weeks = 1 month), paid at the start of each month.
//   20 000 for 8 weeks  → 2 months → 10 000 on the group's start date, 10 000 one month later.
//   20 000 for 10 weeks → 2.5 months → 8 000, 8 000, then 4 000 for the last half month.
// A student who joins late only pays the months that haven't ended yet (the current one in full, due the day they join).
// Copied in eltc-web/src/helpers/paymentPlan.js for the preview in the enroll form — keep both in sync.
export const WEEKS_PER_MONTH = 4;

const buildMonthlyPlan = ({ total, weeks, startDate, joinDate = new Date() }) => {
  const months = Math.max(weeks > 0 ? weeks / WEEKS_PER_MONTH : 1, 0.5);
  const count = Math.ceil(months);
  const start = toDay(startDate ?? joinDate);
  const joined = toDay(joinDate);
  const courseEnd = dayjs(start).add(weeks > 0 ? weeks * 7 : 30, 'day').toDate();
  const perMonth = total / months;

  const parts = [];
  for (let i = 0; i < count; i++) {
    const monthStart = addMonths(start, i);
    const monthEnd = i === count - 1 ? courseEnd : addMonths(start, i + 1);
    if (joined >= monthEnd) continue; // this month is already over: not charged
    const share = Math.min(1, months - i); // 0.5 for a last half month
    parts.push({ share, dueDate: monthStart > joined ? monthStart : joined, installment: { index: i + 1, count } });
  }

  // Whole dinars; the last payment absorbs the rounding so the total is exact.
  const due = Math.round(perMonth * parts.reduce((s, p) => s + p.share, 0));
  let left = due;
  return parts.map((p, i) => {
    const amount = i === parts.length - 1 ? left : Math.round(perMonth * p.share);
    left -= amount;
    return { amount, dueDate: p.dueDate, installment: p.installment, share: p.share };
  });
};

export default buildMonthlyPlan;
