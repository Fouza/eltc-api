import { HttpError } from '../helpers/errors.js';
import * as databaseApi from '../services/databaseApi/index.js';
import { isProd } from '../config.js';

// Last middleware. Every error becomes { status, errorMessage, details? }. 5xx are written to the logs collection.
const errorHandler = (err, req, res, _next) => {
  let status = err instanceof HttpError ? err.status : err.status ?? 500;
  let message = err.message;
  let details = err.details;

  if (err.name === 'ValidationError') {
    status = 400;
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    message = 'Some fields are invalid';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `This ${Object.keys(err.keyValue ?? {}).join(', ') || 'value'} already exists`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  }

  if (status >= 500) {
    console.error(err);
    const { password: _p, ...body } = req.body ?? {};
    databaseApi.insertLog({
      type: 'error', method: req.method, url: req.originalUrl, body, userId: req.user_id, errorMessage: err.message, errorStack: err.stack,
    });
    if (isProd) message = 'Something went wrong';
  }
  res.status(status).json({ status, errorMessage: message, ...(details ? { details } : {}) });
};

export default errorHandler;
