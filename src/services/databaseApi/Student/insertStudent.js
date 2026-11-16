import { studentsCollection } from '../../../models/index.js';
import generateNumber from '../Counter/generateNumber.js';
import getStudentById from './getStudentById.js';

const insertStudent = async (data, userId) => {
  const studentNumber = await generateNumber('ELTC');
  const student = await studentsCollection.create({ ...data, studentNumber, createdBy: userId });
  return getStudentById(student._id);
};

export default insertStudent;
