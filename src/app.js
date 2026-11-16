import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { randomUUID } from 'node:crypto';
import config from './config.js';
import api from './api/index.js';
import errorHandler from './middleware/errorHandler.js';
import { notFound } from './helpers/errors.js';

// The Express app without listening, so tests can use it with supertest.
export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use((req, res, next) => {
    req.id = req.get('x-request-id') ?? randomUUID();
    res.set('x-request-id', req.id);
    next();
  });
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  if (config.env !== 'production' && config.env !== 'test') app.use(morgan('dev'));
  // Keep the raw body for webhook signature checks (see blueprint 9.4).
  app.use(express.json({ limit: config.bodyLimit, verify: (req, _res, buf) => { req.rawBody = buf; } }));
  app.use(express.urlencoded({ extended: true, limit: config.bodyLimit }));
  app.use((req, res, next) => {
    if (req.method === 'GET') res.set('Cache-Control', 'no-store'); // private data, never cached
    next();
  });

  app.use('/api', api({ config }));
  app.use((_req, _res) => {
    throw notFound('Route not found');
  });
  app.use(errorHandler);
  return app;
};
