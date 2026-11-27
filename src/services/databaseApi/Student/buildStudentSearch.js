import { prefixRegex } from '../../../helpers/strings.js';

// "dup", "Dupont Marie", "0550", "ELTC-2026-0012" → anchored regex conditions (index friendly).
const buildStudentSearch = (q) => {
  const text = String(q ?? '').trim();
  if (!text) return {};
  const words = text.split(/\s+/);
  if (words.length >= 2) {
    const [a, ...rest] = words;
    const b = rest.join(' ');
    return {
      $or: [
        { firstName: prefixRegex(a), lastName: prefixRegex(b) },
        { lastName: prefixRegex(a), firstName: prefixRegex(b) },
        { lastName: prefixRegex(text) },
      ],
    };
  }
  const digits = text.replace(/[\s.-]/g, '');
  return {
    $or: [
      { firstName: prefixRegex(text) },
      { lastName: prefixRegex(text) },
      { studentNumber: prefixRegex(text) },
      { email: prefixRegex(text) },
      ...(/^\+?\d{3,}$/.test(digits) ? [{ phone: prefixRegex(digits) }, { phone2: prefixRegex(digits) }, { 'guardian.phone': prefixRegex(digits) }] : []),
    ],
  };
};

export default buildStudentSearch;
