import * as databaseApi from '../../services/databaseApi/index.js';
import { notFound } from '../../helpers/errors.js';
import { assertCampusAccess } from '../../helpers/campusScope.js';
import { CAN } from '../../constants/roles.js';

// Profile: student + enrollments + invoices + payments + attendance + grades.
const getStudent = async (req, res) => {
  const overview = await databaseApi.getStudentOverview(req.params.id);
  if (!overview) throw notFound('Student not found');
  assertCampusAccess(req.user, overview.student.campus?._id);
  if (!req.user.roles.some((r) => CAN.viewFinance.includes(r))) {
    delete overview.invoices;
    delete overview.payments;
    delete overview.finance;
  }
  res.json(overview);
};

export default getStudent;
