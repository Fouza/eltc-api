import { teachersCollection } from '../../../models/index.js';

const getTeacherById = (id) =>
  teachersCollection.findById(id).populate('languages', 'name code color').populate('campusIds', 'name code color').lean();

export default getTeacherById;
