import { Router } from 'express';
import bcrypt from 'bcrypt';
import * as databaseApi from '../services/databaseApi/index.js';
import { usersCollection } from '../models/index.js';
import { badRequest } from '../helpers/errors.js';
import { generateToken } from '../services/authenticationApi/index.js';

// The logged-in user's own account.
export default () => {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await databaseApi.getUserById(req.user_id));
  });

  router.put('/', async (req, res) => {
    res.json(await databaseApi.updateUser(req.user_id, req.body, ['firstName', 'lastName', 'phone']));
  });

  router.put('/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await usersCollection.findById(req.user_id).select('+password').lean();
    if (!(await bcrypt.compare(currentPassword ?? '', user.password))) throw badRequest('The current password is wrong');
    await databaseApi.updateUserPassword(req.user_id, newPassword);
    // Old tokens stop working after a password change: hand back a fresh one.
    res.json({ token: generateToken(user) });
  });

  return router;
};
