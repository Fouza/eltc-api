import { teachersCollection } from '../../../models/index.js';
import getTeacherById from './getTeacherById.js';

const insertTeacher = async (data) => getTeacherById((await teachersCollection.create(data))._id);

export default insertTeacher;
