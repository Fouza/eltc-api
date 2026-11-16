import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN } from '../constants/roles.js';

export default () => {
  const router = Router();
  router.param('id', validateObjectId);

  router.get('/', async (_req, res) => {
    res.json(await databaseApi.getCampuses());
  });

  router.post('/', requireRoles(CAN.manageCampuses), async (req, res) => {
    res.status(201).json(await databaseApi.insertCampus(req.body));
  });

  router.put('/:id', requireRoles(CAN.manageCampuses), async (req, res) => {
    res.json(await databaseApi.updateCampus(req.params.id, req.body));
  });

  router.delete('/:id', requireRoles(CAN.manageCampuses), async (req, res) => {
    res.json(await databaseApi.deleteCampus(req.params.id));
  });

  return router;
};
