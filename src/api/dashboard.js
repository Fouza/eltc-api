import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import { CAN } from '../constants/roles.js';

export default () => {
  const router = Router();

  router.get('/', requireRoles(CAN.viewDashboard), async (req, res) => {
    res.json(await databaseApi.getDashboardSummary(req.user, req.query));
  });

  return router;
};
