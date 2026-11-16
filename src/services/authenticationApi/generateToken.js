import jwt from 'jsonwebtoken';
import config from '../../config.js';

// Same payload idea as Rangewell: { _id, roles, campusIds }.
const generateToken = (user) =>
  jwt.sign({ _id: String(user._id), roles: user.roles, campusIds: (user.campusIds ?? []).map((c) => String(c._id ?? c)) }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

export default generateToken;
