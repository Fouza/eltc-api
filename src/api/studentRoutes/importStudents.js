import * as databaseApi from '../../services/databaseApi/index.js';
import { badRequest } from '../../helpers/errors.js';
import { assertCampusAccess } from '../../helpers/campusScope.js';

// Body: { campus, status, rows: [{ firstName, lastName, phone, ... }] }
const importStudents = async (req, res) => {
  const { rows, campus, status } = req.body;
  if (!Array.isArray(rows) || !rows.length) throw badRequest('No rows to import');
  if (rows.length > 2000) throw badRequest('Import at most 2000 rows at a time');
  if (!campus) throw badRequest('Choose a campus');
  assertCampusAccess(req.user, campus);
  res.json(await databaseApi.importStudents(rows, { campus, status }, req.user_id));
};

export default importStudents;
