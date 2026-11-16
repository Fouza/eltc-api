import { examsCollection, enrollmentsCollection } from '../../../models/index.js';
import { badRequest, notFound } from '../../../helpers/errors.js';
import getExamById from './getExamById.js';

// Saves the scores typed from the teacher's list. A "final" exam also sets each enrollment's final result.
const saveExamResults = async (id, results = [], userId) => {
  const exam = await examsCollection.findById(id).lean();
  if (!exam) throw notFound('Exam not found');
  const clean = [];
  for (const r of results) {
    const student = r.student?._id ?? r.student;
    const hasScore = r.score !== '' && r.score !== null && r.score !== undefined;
    if (!student || (!hasScore && !r.absent && !r.comment)) continue;
    const score = hasScore ? Number(r.score) : undefined;
    if (hasScore && (Number.isNaN(score) || score < 0 || score > exam.maxScore)) {
      throw badRequest(`Scores must be between 0 and ${exam.maxScore}`);
    }
    clean.push({ student, score: r.absent ? undefined : score, absent: Boolean(r.absent), comment: r.comment || undefined });
  }
  const status = clean.length ? 'graded' : 'scheduled';
  await examsCollection.updateOne({ _id: id }, { $set: { results: clean, status, recordedBy: userId } });

  if (exam.type === 'final') {
    await Promise.all(
      clean.map((r) =>
        enrollmentsCollection.updateOne(
          { group: exam.group, student: r.student, status: { $in: ['active', 'completed'] } },
          {
            $set: {
              finalScore: r.absent ? null : r.score,
              finalResult: r.absent ? 'failed' : r.score >= exam.passScore ? 'passed' : 'failed',
            },
          },
        ),
      ),
    );
  }
  return getExamById(id);
};

export default saveExamResults;
