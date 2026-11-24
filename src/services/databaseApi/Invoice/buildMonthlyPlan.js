import { addDays, toDay } from '../../../helpers/dates.js';

// The school's rule: a level is paid in blocks of 4 weeks, counted from the group's start date (no pause for holidays).
//   Each block is due on its first day and becomes overdue on the first day of the next block if not fully paid.
//   (Kids, 1 session a week: overdue at session 5. Adults on weekends: session 9. Adults in the evening: session 13.)
//   20 000 for 8 weeks  → weeks 1–4: 10 000 due on the start date, weeks 5–8: 10 000 due on day 29.
//   20 000 for 10 weeks → 8 000, 8 000, then 4 000 for weeks 9–10.
// A student who joins late pays only the weeks left: blocks already over are skipped, and in the current block
// only the weeks from the one they join in (joining in week 3 → weeks 3–4, half the block), due the day they join.
// The whole group keeps the same due and overdue dates.
// Copied in eltc-web/src/helpers/paymentPlan.js for the preview in the enroll form — keep both in sync.
export const WEEKS_PER_BLOCK = 4;
export const WEEKS_PER_MONTH = WEEKS_PER_BLOCK; // older name
const DAY = 24 * 3600 * 1000;

const buildMonthlyPlan = ({ total, weeks, startDate, joinDate = new Date() }) => {
  const totalWeeks = weeks > 0 ? weeks : WEEKS_PER_BLOCK;
  const count = Math.ceil(totalWeeks / WEEKS_PER_BLOCK);
  const start = toDay(startDate ?? joinDate);
  const joined = toDay(joinDate);
  const perWeek = total / totalWeeks;
  // Week of the level the student joins in (1 = first week; before the start counts as week 1).
  const joinWeek = joined <= start ? 1 : Math.floor((joined - start) / DAY / 7) + 1;

  const parts = [];
  for (let i = 0; i < count; i++) {
    const firstWeek = i * WEEKS_PER_BLOCK + 1;
    const lastWeek = Math.min(firstWeek + WEEKS_PER_BLOCK - 1, totalWeeks);
    if (joinWeek > lastWeek) continue; // this block is already over: not charged
    const fromWeek = Math.max(firstWeek, joinWeek);
    const blockStart = addDays(start, (firstWeek - 1) * 7);
    parts.push({
      weeks: lastWeek - fromWeek + 1,
      share: (lastWeek - fromWeek + 1) / WEEKS_PER_BLOCK,
      dueDate: blockStart > joined ? blockStart : joined,
      overdueAt: addDays(start, lastWeek * 7), // first day of the next block (or the end of the level)
      installment: { index: i + 1, count, fromWeek, toWeek: lastWeek },
    });
  }

  // Whole dinars; the last payment absorbs the rounding so the total is exact.
  let left = Math.round(perWeek * parts.reduce((s, p) => s + p.weeks, 0));
  return parts.map((p, i) => {
    const amount = i === parts.length - 1 ? left : Math.round(perWeek * p.weeks);
    left -= amount;
    return { amount, dueDate: p.dueDate, overdueAt: p.overdueAt, installment: p.installment, share: p.share };
  });
};

export default buildMonthlyPlan;
