import mongoose from 'mongoose';
import { ROLES } from '../../../constants/roles.js';
import { userCampusIds } from '../../../helpers/campusScope.js';

// A user sees notifications for their roles (admin sees all) and their campuses.
const notificationFilterForUser = (user) => {
  const and = [];
  if (!user.roles?.includes(ROLES.ADMIN)) and.push({ $or: [{ roles: { $size: 0 } }, { roles: { $in: user.roles ?? [] } }] });
  const campuses = userCampusIds(user);
  if (campuses.length) and.push({ $or: [{ campus: null }, { campus: { $in: campuses.map((id) => new mongoose.Types.ObjectId(id)) } }] });
  return and.length ? { $and: and } : {};
};

export default notificationFilterForUser;
