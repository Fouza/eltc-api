import { studentsCollection } from '../../../models/index.js';
import getStudentById from './getStudentById.js';
import { splitPhones } from '../../../models/schema/studentSchema.js';

const updateStudent = async (id, data) => {
  const { studentNumber: _n, createdBy: _c, ...rest } = data;
  if (rest.phone !== undefined) splitPhones(rest);
  await studentsCollection.updateOne({ _id: id }, { $set: rest }, { runValidators: true });
  return getStudentById(id);
};

export default updateStudent;
