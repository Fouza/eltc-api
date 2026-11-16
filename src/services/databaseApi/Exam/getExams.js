import mongoose from 'mongoose';
import { examsCollection } from '../../../models/index.js';
import { campusFilter } from '../../../helpers/campusScope.js';
import computeExamStats from './computeExamStats.js';

const getExams = async (query, user) => {
  const filter = { ...campusFilter(user, query.campus) };
  if (query.group) filter.group = new mongoose.Types.ObjectId(String(query.group));
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) filter.date.$lte = new Date(`${query.to}T23:59:59.999Z`);
  }
  const exams = await examsCollection
    .find(filter)
    .populate({ path: 'group', select: 'name levelNumber teacher', populate: { path: 'teacher', select: 'firstName lastName' } })
    .populate('program', 'name color')
    .populate('campus', 'name code color')
    .sort({ date: query.sort === 'asc' ? 1 : -1 })
    .limit(Number(query.limit) || 300)
    .lean();
  return exams.map(({ results, ...e }) => ({ ...e, stats: computeExamStats({ ...e, results }), resultsCount: results.length }));
};

export default getExams;
