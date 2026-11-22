import { Router } from 'express';
import auth from '../middleware/auth.js';
import authRouter from './auth.js';
import account from './account.js';
import users from './users.js';
import campuses from './campuses.js';
import languages from './languages.js';
import programs from './programs.js';
import books from './books.js';
import teachers from './teachers.js';
import groups from './groups.js';
import students from './students.js';
import enrollments from './enrollments.js';
import attendance from './attendance.js';
import exams from './exams.js';
import invoices from './invoices.js';
import payments from './payments.js';
import notifications from './notifications.js';
import dashboard from './dashboard.js';
import search from './search.js';
import settings from './settings.js';
import cron from './cron.js';

// Mount order = auth zones: public routes first, then the auth middleware, then everything else.
export default ({ config }) => {
  const api = Router();

  // ---- public
  api.get('/health', (_req, res) => res.json({ ok: true, env: config.env }));
  api.use('/auth', authRouter({ config }));
  api.use('/cron', cron({ config })); // protected by its own secret, not by staff login

  // ---- logged-in staff
  api.use(auth);
  api.use('/me', account({ config }));
  api.use('/users', users({ config }));
  api.use('/campuses', campuses({ config }));
  api.use('/languages', languages({ config }));
  api.use('/programs', programs({ config }));
  api.use('/books', books({ config }));
  api.use('/teachers', teachers({ config }));
  api.use('/groups', groups({ config }));
  api.use('/students', students({ config }));
  api.use('/enrollments', enrollments({ config }));
  api.use('/attendance', attendance({ config }));
  api.use('/exams', exams({ config }));
  api.use('/invoices', invoices({ config }));
  api.use('/payments', payments({ config }));
  api.use('/notifications', notifications({ config }));
  api.use('/dashboard', dashboard({ config }));
  api.use('/search', search({ config }));
  api.use('/settings', settings({ config }));

  return api;
};
