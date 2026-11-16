import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import validateObjectId from '../middleware/validateObjectId.js';

export default () => {
  const router = Router();
  router.param('id', validateObjectId);

  router.get('/', async (req, res) => {
    res.json(await databaseApi.getNotificationsForUser(req.user, { limit: req.query.limit, unread: req.query.unread === '1' }));
  });

  router.put('/read-all', async (req, res) => {
    res.json(await databaseApi.markAllNotificationsRead(req.user));
  });

  router.put('/:id/read', async (req, res) => {
    res.json(await databaseApi.markNotificationRead(req.params.id, req.user_id));
  });

  return router;
};
