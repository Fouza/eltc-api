import { enrollmentsCollection } from '../../../models/index.js';
import { levelLabel, mentionFor } from '../../../constants/enums.js';
import certificateFilters, { certifiedEnrollmentIds } from './certificateFilters.js';
import getStudentBalances from '../Student/getStudentBalances.js';

// "To issue": students who passed a level and have no certificate for it yet, most recent first, with what they still owe.
const getCertificateCandidates = async (query = {}, user) => {
  const filter = await certificateFilters(query, user);
  if (!filter) return [];
  const done = await certifiedEnrollmentIds();
  const rows = await enrollmentsCollection
    .find({ ...filter, finalResult: 'passed', _id: { $nin: done } })
    .populate('student', 'firstName lastName studentNumber phone phone2 guardian')
    .populate('group', 'name startDate endDate')
    .populate('program', 'name audience levels color')
    .populate('campus', 'name code')
    .sort({ endedAt: -1, updatedAt: -1 })
    .limit(500)
    .lean();
  const balances = await getStudentBalances(rows.map((r) => r.student?._id).filter(Boolean));
  return rows
    .filter((r) => r.student)
    .map((r) => ({
      _id: r._id,
      student: r.student,
      group: r.group,
      program: r.program && { _id: r.program._id, name: r.program.name, color: r.program.color },
      campus: r.campus,
      levelNumber: r.levelNumber,
      levelName: levelLabel(r.levelNumber, r.program?.levels, r.program?.audience),
      finalScore: r.finalScore ?? null,
      mention: mentionFor(r.finalScore),
      finishedAt: r.endedAt ?? r.group?.endDate ?? r.updatedAt,
      balance: balances[String(r.student._id)] ?? { due: 0, overdue: 0 },
    }));
};

export default getCertificateCandidates;
