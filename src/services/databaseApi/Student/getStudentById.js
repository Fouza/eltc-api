import { studentsCollection } from '../../../models/index.js';

const getStudentById = (id) =>
  studentsCollection
    .findById(id)
    .populate('campus', 'name code color')
    .populate('desiredProgram', 'name audience')
    .populate('createdBy', 'firstName lastName')
    .lean();

export default getStudentById;
