import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';

export default () => {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await databaseApi.globalSearch(req.query.q, req.user));
  });

  return router;
};
