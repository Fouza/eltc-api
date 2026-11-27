import dayjs from 'dayjs';
import { addDays, toDay } from './dates.js';

// A group's class days (from its weekly schedule) and its cancelled sessions. Dates are days at 00:00 UTC.
const dayOf = (d) => new Date(d).getUTCDay();
const days = (group) => new Set((group.schedule ?? []).map((s) => s.day));
const pretty = (d) => dayjs(toDay(d).toISOString().slice(0, 10)).format('D MMM YYYY');
const same = (a, b) => toDay(a).getTime() === toDay(b).getTime();

export const isClassDay = (group, d) => days(group).has(dayOf(toDay(d)));
export const isCancelledSession = (group, d) => (group.cancelledSessions ?? []).some((c) => same(c.date, d));

// One session later (dir 1) or earlier (dir -1): the next class day after d. Kids: a week; adults: the next class of the week.
export const stepSession = (group, d, dir = 1) => {
  const set = days(group);
  if (!set.size) return addDays(d, 7 * dir);
  let x = toDay(d);
  for (let i = 0; i < 7; i++) {
    x = addDays(x, dir);
    if (set.has(dayOf(x))) return x;
  }
  return x;
};

// A date pushed back by the cancelled sessions on or before it (used when invoices are created after a cancellation).
export const afterCancellations = (group, d) => {
  let x = toDay(d);
  for (const c of [...(group.cancelledSessions ?? [])].sort((a, b) => new Date(a.date) - new Date(b.date))) {
    if (x >= toDay(c.date)) x = stepSession(group, x, 1);
  }
  return x;
};

// Why there is no class for this group on this day (null = there is one).
export const sessionProblem = (group, d) => {
  const day = toDay(d);
  if (group.startDate && day < toDay(group.startDate)) return `The group starts on ${pretty(group.startDate)}`;
  if (group.endDate && day > toDay(group.endDate)) return `The group ended on ${pretty(group.endDate)}`;
  if (!isClassDay(group, day)) return 'The group has no class on this day';
  if (isCancelledSession(group, day)) return 'This session was cancelled';
  return null;
};
