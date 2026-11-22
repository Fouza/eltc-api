export const CAMPUS_STATUS = ['active', 'opening', 'closed'];
export const AUDIENCES = ['adults', 'children'];
export const STUDENT_STATUS = ['prospect', 'active', 'inactive', 'graduated'];
export const GENDERS = ['male', 'female'];
export const GROUP_STATUS = ['planned', 'ongoing', 'completed', 'cancelled'];
export const ENROLLMENT_STATUS = ['active', 'completed', 'dropped', 'transferred'];
export const FINAL_RESULTS = ['pending', 'passed', 'failed'];
export const ATTENDANCE_STATUS = ['present', 'absent', 'late', 'excused'];
export const EXAM_TYPES = ['placement', 'quiz', 'midterm', 'final', 'oral'];
export const EXAM_STATUS = ['scheduled', 'graded'];
export const INVOICE_STATUS = ['unpaid', 'partial', 'paid', 'cancelled'];
export const INVOICE_KINDS = ['course', 'book', 'other'];
export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'cheque'];
export const NOTIFICATION_SEVERITY = ['info', 'warning', 'danger'];
// Default level names of a new program. Programs store their own names, so these stay editable.
// Adults: A1, A2, B1, B1+, B2, C1. Children: Bounce 1 → Bounce 6.
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];
export const CHILDREN_LEVELS = ['Bounce 1', 'Bounce 2', 'Bounce 3', 'Bounce 4', 'Bounce 5', 'Bounce 6'];
export const DEFAULT_LEVELS = { adults: CEFR_LEVELS, children: CHILDREN_LEVELS };
export const defaultLevelNames = (audience) => DEFAULT_LEVELS[audience] ?? CEFR_LEVELS;
export const levelLabel = (number, levels, audience) =>
  levels?.find((l) => l.number === number)?.name ?? defaultLevelNames(audience)[number - 1] ?? `Level ${number}`;
