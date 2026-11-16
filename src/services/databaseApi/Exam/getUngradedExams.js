import { examsCollection } from '../../../models/index.js';
import { startOfToday } from '../../../helpers/dates.js';

const getUngradedExams = () =>
  examsCollection.find({ status: 'scheduled', date: { $lt: startOfToday() } }).populate('group', 'name').lean();

export default getUngradedExams;
