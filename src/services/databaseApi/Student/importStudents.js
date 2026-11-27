import { studentsCollection } from '../../../models/index.js';
import generateNumber from '../Counter/generateNumber.js';
import { escapeRegex } from '../../../helpers/strings.js';

const FIELDS = ['firstName', 'lastName', 'gender', 'birthDate', 'birthPlace', 'phone', 'phone2', 'email', 'address', 'city', 'occupation', 'source', 'notes'];

// Rows come from a spreadsheet already parsed by the web app (CSV → JSON).
// Duplicates (same first name + last name + phone) are skipped, not overwritten.
const importStudents = async (rows, { campus, status = 'active' }, userId) => {
  const report = { created: 0, skipped: 0, errors: [] };
  for (const [index, row] of rows.entries()) {
    const data = Object.fromEntries(FIELDS.filter((f) => row[f] !== undefined && row[f] !== '').map((f) => [f, String(row[f]).trim()]));
    if (row.guardianName || row.guardianPhone) data.guardian = { name: row.guardianName, phone: row.guardianPhone, relation: row.guardianRelation };
    if (!data.firstName || !data.lastName) {
      report.errors.push({ row: index + 1, error: 'firstName and lastName are required' });
      continue;
    }
    if (data.gender) data.gender = /^f/i.test(data.gender) ? 'female' : /^m|^h/i.test(data.gender) ? 'male' : undefined;
    if (data.birthDate && Number.isNaN(Date.parse(data.birthDate))) delete data.birthDate;
    const duplicate = await studentsCollection.exists({
      firstName: new RegExp(`^${escapeRegex(data.firstName)}$`, 'i'),
      lastName: new RegExp(`^${escapeRegex(data.lastName)}$`, 'i'),
      ...(data.phone ? { phone: data.phone } : {}),
    });
    if (duplicate) {
      report.skipped++;
      continue;
    }
    try {
      await studentsCollection.create({ ...data, campus, status, studentNumber: await generateNumber('ELTC'), createdBy: userId });
      report.created++;
    } catch (err) {
      report.errors.push({ row: index + 1, error: err.message });
    }
  }
  return report;
};

export default importStudents;
