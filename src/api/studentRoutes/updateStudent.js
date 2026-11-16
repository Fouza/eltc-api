import * as databaseApi from '../../services/databaseApi/index.js';
import { notFound } from '../../helpers/errors.js';
import { assertCampusAccess } from '../../helpers/campusScope.js';

const updateStudent = async (req, res) => {
  const existing = await databaseApi.getStudentById(req.params.id);
  if (!existing) throw notFound('Student not found');
  assertCampusAccess(req.user, existing.campus?._id);
  if (req.body.campus) assertCampusAccess(req.user, req.body.campus);
  res.json(await databaseApi.updateStudent(req.params.id, req.body));
};

export default updateStudent;
