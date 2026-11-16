import { studentsCollection, groupsCollection, teachersCollection } from '../../../models/index.js';
import { campusFilter } from '../../../helpers/campusScope.js';
import { escapeRegex, prefixRegex } from '../../../helpers/strings.js';
import buildStudentSearch from '../Student/buildStudentSearch.js';

// Top-bar search: students, groups and teachers (5 each).
const globalSearch = async (q, user) => {
  if (!q || String(q).trim().length < 2) return { students: [], groups: [], teachers: [] };
  const scope = campusFilter(user);
  const [students, groups, teachers] = await Promise.all([
    studentsCollection
      .find({ ...scope, ...buildStudentSearch(q) }, { firstName: 1, lastName: 1, studentNumber: 1, status: 1, phone: 1 })
      .limit(6)
      .lean(),
    groupsCollection.find({ ...scope, name: new RegExp(escapeRegex(q.trim()), 'i') }, { name: 1, levelNumber: 1, status: 1 }).limit(5).lean(),
    teachersCollection
      .find({ $or: [{ firstName: prefixRegex(q) }, { lastName: prefixRegex(q) }] }, { firstName: 1, lastName: 1, phone: 1 })
      .limit(5)
      .lean(),
  ]);
  return { students, groups, teachers };
};

export default globalSearch;
