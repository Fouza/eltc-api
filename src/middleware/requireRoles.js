import { forbidden } from '../helpers/errors.js';

// requireRoles('admin', 'secretary') or requireRoles(CAN.manageStudents)
const requireRoles =
  (...roles) =>
  (req, _res, next) => {
    const allowed = roles.flat();
    if (!req.user?.roles?.some((r) => allowed.includes(r))) throw forbidden('Your role does not allow this action');
    next();
  };

export default requireRoles;
