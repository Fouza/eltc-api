import { Router } from 'express';
import { login } from '../services/authenticationApi/index.js';

// Public: mounted before the auth middleware.
export default () => {
  const router = Router();

  router.post('/login', async (req, res) => {
    res.json(await login(req.body));
  });

  return router;
};
