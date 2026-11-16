import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN } from '../constants/roles.js';
import { badRequest, notFound } from '../helpers/errors.js';

// Staff accounts. Only the admin (the school manager) manages them.
export default () => {
  const router = Router();
  router.param('id', validateObjectId);
  router.use(requireRoles(CAN.manageUsers));

  router.get('/', async (_req, res) => {
    res.json(await databaseApi.getUsers());
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await databaseApi.insertUser(req.body));
  });

  router.put('/:id', async (req, res) => {
    if (String(req.params.id) === String(req.user_id) && (req.body.active === false || (req.body.roles && !req.body.roles.includes('admin')))) {
      throw badRequest('You cannot remove your own admin access');
    }
    const user = await databaseApi.updateUser(req.params.id, req.body);
    if (!user) throw notFound('User not found');
    res.json(user);
  });

  router.put('/:id/password', async (req, res) => {
    res.json(await databaseApi.updateUserPassword(req.params.id, req.body.password));
  });

  return router;
};
