import { describe, it, expect } from 'vitest';
import buildMonthlyPlan from './buildMonthlyPlan.js';

const day = (d) => d.toISOString().slice(0, 10);

describe('buildMonthlyPlan (blocks of 4 weeks)', () => {
  it('8 weeks → 2 blocks: due on day 1 and day 29, each overdue when the next block starts', () => {
    const plan = buildMonthlyPlan({ total: 20000, weeks: 8, startDate: '2026-10-02', joinDate: '2026-09-20' });
    expect(plan.map((p) => p.amount)).toEqual([10000, 10000]);
    expect(plan.map((p) => day(p.dueDate))).toEqual(['2026-10-02', '2026-10-30']);
    expect(plan.map((p) => day(p.overdueAt))).toEqual(['2026-10-30', '2026-11-27']);
    expect(plan[1].installment).toEqual({ index: 2, count: 2, fromWeek: 5, toWeek: 8 });
  });

  it('kids: 1 session a week → paid by session 4, overdue on the day of session 5', () => {
    const [first] = buildMonthlyPlan({ total: 15000, weeks: 10, startDate: '2026-10-03', joinDate: '2026-10-03' });
    // Saturdays: 3, 10, 17, 24 Oct are sessions 1–4; 31 Oct is session 5.
    expect(day(first.overdueAt)).toBe('2026-10-31');
  });

  it('10 weeks → 2 full blocks and weeks 9–10 at half price, overdue at the end of the level', () => {
    const plan = buildMonthlyPlan({ total: 20000, weeks: 10, startDate: '2026-10-01', joinDate: '2026-10-01' });
    expect(plan.map((p) => p.amount)).toEqual([8000, 8000, 4000]);
    expect(day(plan[2].dueDate)).toBe('2026-11-26');
    expect(day(plan[2].overdueAt)).toBe('2026-12-10');
    expect(plan[2].installment).toMatchObject({ fromWeek: 9, toWeek: 10 });
  });

  it('a student joining in week 3 pays weeks 3–4 now (same overdue date as the group), then full blocks', () => {
    const plan = buildMonthlyPlan({ total: 24000, weeks: 12, startDate: '2026-10-01', joinDate: '2026-10-16' });
    expect(plan.map((p) => p.amount)).toEqual([4000, 8000, 8000]);
    expect(plan.map((p) => day(p.dueDate))).toEqual(['2026-10-16', '2026-10-29', '2026-11-26']);
    expect(day(plan[0].overdueAt)).toBe('2026-10-29');
    expect(plan[0].installment).toMatchObject({ index: 1, fromWeek: 3, toWeek: 4 });
  });

  it('blocks already over are not charged', () => {
    const plan = buildMonthlyPlan({ total: 24000, weeks: 12, startDate: '2026-09-01', joinDate: '2026-10-01' });
    // 1 Oct is day 31 → week 5, the first week of block 2.
    expect(plan.map((p) => p.amount)).toEqual([8000, 8000]);
    expect(plan[0].installment.index).toBe(2);
  });

  it('keeps the exact total when the split is not round', () => {
    const plan = buildMonthlyPlan({ total: 25000, weeks: 12, startDate: '2026-10-01', joinDate: '2026-10-01' });
    expect(plan.reduce((s, p) => s + p.amount, 0)).toBe(25000);
  });
});
