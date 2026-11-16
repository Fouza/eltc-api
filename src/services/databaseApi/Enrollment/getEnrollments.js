import { enrollmentsCollection } from '../../../models/index.js';

const getEnrollments = (filter = {}) =>
  enrollmentsCollection
    .find(filter)
    .populate('student', 'firstName lastName studentNumber')
    .populate('group', 'name levelNumber status')
    .populate('program', 'name')
    .sort({ enrolledAt: -1 })
    .lean();

export default getEnrollments;
