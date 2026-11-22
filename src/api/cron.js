import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { runners } from '../scheduler/jobs/index.js';
import { unauthorized } from '../helpers/errors.js';

// Runs every morning job once (overdue payments, low attendance, exams to grade, payments due, group end dates, book stock).
// For hosts without a background process (Render free plan): an outside scheduler calls
//   POST /api/cron/run   with the header   x-cron-secret: <CRON_SECRET>
// Locally, `npm run dev:scheduler` still runs them on their own schedule.
const sameSecret = (a = '', b = '') => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export default ({ config }) => {
  const router = Router();

  router.post('/run', async (req, res) => {
    if (!config.cronSecret || !sameSecret(req.get('x-cron-secret'), config.cronSecret)) throw unauthorized('Bad cron secret');
    const results = {};
    for (const [name, run] of Object.entries(runners)) {
      try {
        results[name] = await run();
      } catch (err) {
        results[name] = { error: err.message }; // one failing job must not stop the others
      }
    }
    res.json({ ok: true, ranAt: new Date().toISOString(), results });
  });

  return router;
};
