import jwt from 'jsonwebtoken';
import config from '../../config.js';
import { usersCollection } from '../../models/index.js';
import { unauthorized } from '../../helpers/errors.js';

// Verifies the JWT and reloads the user, so a deactivated user or a role change applies immediately.
const verifyToken = async (token) => {
  if (!token) throw unauthorized('Missing token');
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('Invalid or expired token');
  }
  const user = await usersCollection.findById(payload._id).lean();
  if (!user || !user.active) throw unauthorized('This account is disabled');
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
    throw unauthorized('Password changed, please log in again');
  }
  return user;
};

export default verifyToken;
