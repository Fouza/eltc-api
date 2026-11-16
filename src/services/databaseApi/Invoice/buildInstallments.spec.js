import { describe, it, expect } from 'vitest';
import buildInstallments from './buildInstallments.js';

describe('buildInstallments', () => {
  it('splits and puts the rounding on the last one', () => {
    const parts = buildInstallments(10000, 3, new Date('2026-10-01'));
    expect(parts.map((p) => p.amount)).toEqual([3333.33, 3333.33, 3333.34]);
    expect(parts[2].dueDate.getMonth()).toBe(11);
    expect(parts[1].installment).toEqual({ index: 2, count: 3 });
  });
});
