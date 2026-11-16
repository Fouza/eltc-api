import { examsCollection } from '../../../models/index.js';
import getGroupRoster from '../Group/getGroupRoster.js';
import computeExamStats from './computeExamStats.js';

// The exam and one row per student of the group (with their result if already typed).
const getExamById = async (id) => {
  const exam = await examsCollection
    .findById(id)
    .populate({ path: 'group', select: 'name levelNumber teacher', populate: { path: 'teacher', select: 'firstName lastName' } })
    .populate('program', 'name color')
    .populate('campus', 'name code color')
    .populate('recordedBy', 'firstName lastName')
    .lean();
  if (!exam) return null;
  const roster = await getGroupRoster(exam.group._id, ['active', 'completed']);
  const byStudent = Object.fromEntries(exam.results.map((r) => [String(r.student), r]));
  // The populated student goes last so the result's raw student id doesn't overwrite it.
  const rows = roster.map((e) => ({ ...(byStudent[String(e.student._id)] ?? {}), student: e.student }));
  return { ...exam, rows, stats: computeExamStats(exam) };
};

export default getExamById;
