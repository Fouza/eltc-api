import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import { CAN } from '../constants/roles.js';

export default () => {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await databaseApi.getSettings());
  });

  router.put('/', requireRoles(CAN.manageSettings), async (req, res) => {
    res.json(await databaseApi.updateSettings(req.body));
  });

  return router;
};
