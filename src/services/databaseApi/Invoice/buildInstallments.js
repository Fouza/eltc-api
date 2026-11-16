import { addMonths } from '../../../helpers/dates.js';

// 30 000 in 3 installments from 1 Oct → 10 000 on 1 Oct, 1 Nov, 1 Dec (the last one absorbs rounding).
const buildInstallments = (total, count = 1, firstDueDate = new Date()) => {
  const n = Math.max(1, Math.min(12, Number(count) || 1));
  const base = Math.floor((total / n) * 100) / 100;
  return Array.from({ length: n }, (_, i) => ({
    amount: i === n - 1 ? Math.round((total - base * (n - 1)) * 100) / 100 : base,
    dueDate: addMonths(firstDueDate, i),
    installment: { index: i + 1, count: n },
  }));
};

export default buildInstallments;
