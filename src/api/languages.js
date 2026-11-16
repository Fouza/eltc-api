import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN } from '../constants/roles.js';

export default () => {
  const router = Router();
  router.param('id', validateObjectId);

  router.get('/', async (_req, res) => {
    res.json(await databaseApi.getLanguages());
  });

  router.post('/', requireRoles(CAN.managePrograms), async (req, res) => {
    res.status(201).json(await databaseApi.insertLanguage(req.body));
  });

  router.put('/:id', requireRoles(CAN.managePrograms), async (req, res) => {
    res.json(await databaseApi.updateLanguage(req.params.id, req.body));
  });

  router.delete('/:id', requireRoles(CAN.managePrograms), async (req, res) => {
    res.json(await databaseApi.deleteLanguage(req.params.id));
  });

  return router;
};
