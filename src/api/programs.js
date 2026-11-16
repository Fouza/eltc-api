import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN } from '../constants/roles.js';
import { notFound } from '../helpers/errors.js';

// Programs = workshops (e.g. "French – Adults") with their levels.
export default () => {
  const router = Router();
  router.param('id', validateObjectId);

  router.get('/', async (req, res) => {
    const filter = {};
    if (req.query.language) filter.language = req.query.language;
    if (req.query.active) filter.active = req.query.active === 'true';
    res.json(await databaseApi.getPrograms(filter));
  });

  router.get('/:id', async (req, res) => {
    const program = await databaseApi.getProgramById(req.params.id);
    if (!program) throw notFound('Program not found');
    res.json(program);
  });

  router.post('/', requireRoles(CAN.managePrograms), async (req, res) => {
    res.status(201).json(await databaseApi.insertProgram(req.body));
  });

  router.put('/:id', requireRoles(CAN.managePrograms), async (req, res) => {
    res.json(await databaseApi.updateProgram(req.params.id, req.body));
  });

  router.delete('/:id', requireRoles(CAN.managePrograms), async (req, res) => {
    res.json(await databaseApi.deleteProgram(req.params.id));
  });

  return router;
};
