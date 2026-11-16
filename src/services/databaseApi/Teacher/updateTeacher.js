import { teachersCollection } from '../../../models/index.js';
import getTeacherById from './getTeacherById.js';

const updateTeacher = async (id, data) => {
  await teachersCollection.updateOne({ _id: id }, { $set: data }, { runValidators: true });
  return getTeacherById(id);
};

export default updateTeacher;
