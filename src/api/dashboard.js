import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';

export default () => {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await databaseApi.getDashboardSummary(req.user, req.query));
  });

  return router;
};
