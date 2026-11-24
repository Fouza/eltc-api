import mongoose from 'mongoose';
import { certificatesCollection, studentsCollection } from '../../../models/index.js';
import { campusFilter } from '../../../helpers/campusScope.js';
import { escapeRegex } from '../../../helpers/strings.js';

const oid = (v) => new mongoose.Types.ObjectId(String(v));

// Shared filters for the certificates page: campus (and the user's campuses), program, group, level, q (student name / number).
// Returns null when the text search matches no student (the list is then empty).
const certificateFilters = async (query = {}, user) => {
  const filter = { ...campusFilter(user, query.campus) };
  if (query.program) filter.program = oid(query.program);
  if (query.group) filter.group = oid(query.group);
  if (query.level) filter.levelNumber = Number(query.level);
  if (query.q?.trim()) {
    const words = query.q.trim().split(/\s+/).map((w) => new RegExp(escapeRegex(w), 'i'));
    const ids = await studentsCollection.distinct('_id', {
      $and: words.map((w) => ({ $or: [{ firstName: w }, { lastName: w }, { studentNumber: w }] })),
    });
    if (!ids.length) return null;
    filter.student = { $in: ids };
  }
  return filter;
};

// Enrollments that already have a certificate (revoked ones don't count: the student can get a new one).
export const certifiedEnrollmentIds = () => certificatesCollection.distinct('enrollment', { status: { $ne: 'revoked' } });

export default certificateFilters;
