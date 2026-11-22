import { describe, it, expect } from 'vitest';
import buildMonthlyPlan from './buildMonthlyPlan.js';

const day = (d) => d.toISOString().slice(0, 10);

describe('buildMonthlyPlan', () => {
  it('8 weeks → 2 monthly payments from the start date', () => {
    const plan = buildMonthlyPlan({ total: 20000, weeks: 8, startDate: '2026-10-01', joinDate: '2026-09-20' });
    expect(plan.map((p) => p.amount)).toEqual([10000, 10000]);
    expect(plan.map((p) => day(p.dueDate))).toEqual(['2026-10-01', '2026-11-01']);
    expect(plan[1].installment).toEqual({ index: 2, count: 2 });
  });

  it('10 weeks → 2.5 months: the last payment is half a month', () => {
    const plan = buildMonthlyPlan({ total: 20000, weeks: 10, startDate: '2026-10-01', joinDate: '2026-10-01' });
    expect(plan.map((p) => p.amount)).toEqual([8000, 8000, 4000]);
    expect(day(plan[2].dueDate)).toBe('2026-12-01');
  });

  it('a late student pays only the remaining months, the current one due the day they join', () => {
    const plan = buildMonthlyPlan({ total: 30000, weeks: 12, startDate: '2026-09-01', joinDate: '2026-10-15' });
    expect(plan.map((p) => p.amount)).toEqual([10000, 10000]);
    expect(plan.map((p) => day(p.dueDate))).toEqual(['2026-10-15', '2026-11-01']);
    expect(plan[0].installment.index).toBe(2);
  });

  it('keeps the exact total when the split is not round', () => {
    const plan = buildMonthlyPlan({ total: 25000, weeks: 12, startDate: '2026-10-01', joinDate: '2026-10-01' });
    expect(plan.reduce((s, p) => s + p.amount, 0)).toBe(25000);
  });
});
