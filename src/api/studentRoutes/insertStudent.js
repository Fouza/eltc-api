import * as databaseApi from '../../services/databaseApi/index.js';
import { assertCampusAccess } from '../../helpers/campusScope.js';
import { socketIO } from '../../socket.js';
import { STUDENT_REGISTERED } from '../../constants/events.js';

const insertStudent = async (req, res) => {
  assertCampusAccess(req.user, req.body.campus);
  const student = await databaseApi.insertStudent(req.body, req.user_id);
  socketIO.to('staff').emit(STUDENT_REGISTERED, { _id: student._id, firstName: student.firstName, lastName: student.lastName });
  res.status(201).json(student);
};

export default insertStudent;
