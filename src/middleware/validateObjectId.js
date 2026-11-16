import mongoose from 'mongoose';
import { badRequest } from '../helpers/errors.js';

// Express 5 has no inline regex in paths. Use as router.param('id', validateObjectId).
const validateObjectId = (_req, _res, next, value, name) => {
  if (!mongoose.isValidObjectId(value) || String(value).length !== 24) throw badRequest(`Invalid ${name}`);
  next();
};

export default validateObjectId;
