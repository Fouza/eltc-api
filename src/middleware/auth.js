import { verifyToken } from '../services/authenticationApi/index.js';

// Authorization: Bearer <JWT>. Sets req.user, req.user_id and req.scope (roles), like Rangewell.
const auth = async (req, _res, next) => {
  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const user = await verifyToken(token);
  req.user = user;
  req.user_id = user._id;
  req.scope = user.roles;
  next();
};

export default auth;
