import getNextSequence from './getNextSequence.js';

// generateNumber('INV') → "INV-2026-0042"
const generateNumber = async (prefix, date = new Date()) => {
  const year = date.getFullYear();
  const seq = await getNextSequence(`${prefix}-${year}`);
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
};

export default generateNumber;
