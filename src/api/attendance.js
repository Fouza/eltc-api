import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN } from '../constants/roles.js';
import { badRequest } from '../helpers/errors.js';
import { campusFilter } from '../helpers/campusScope.js';
import notifyLowAttendance from '../services/notifications/notifyLowAttendance.js';

export default () => {
  const router = Router();
  router.param('id', validateObjectId);

  // GET /api/attendance/sheet?groupId=...&date=2026-11-12
  router.get('/sheet', async (req, res) => {
    if (!req.query.groupId || !req.query.date) throw badRequest('groupId and date are required');
    res.json(await databaseApi.getAttendanceSheet(req.query.groupId, req.query.date));
  });

  router.put('/sheet', requireRoles(CAN.recordAttendance), async (req, res) => {
    if (!req.body.groupId || !req.body.date) throw badRequest('groupId and date are required');
    const saved = await databaseApi.saveAttendanceSheet(req.body, req.user_id);
    // Alert right away when a student just reached the absence threshold (pushed live over socket.io).
    const absentIds = saved.entries.filter((e) => e.status === 'absent').map((e) => e.student);
    const alerts = absentIds.length ? await notifyLowAttendance({ groupId: req.body.groupId, studentIds: absentIds }) : { created: [] };
    res.json({ ...(await databaseApi.getAttendanceSheet(req.body.groupId, req.body.date)), alertsCreated: alerts.created.length });
  });

  router.delete('/:id', requireRoles(CAN.recordAttendance), async (req, res) => {
    res.json(await databaseApi.deleteAttendanceSheet(req.params.id));
  });

  // Students who miss too many classes (same rule as the daily notification).
  router.get('/alerts', async (req, res) => {
    const settings = await databaseApi.getSettings();
    res.json(
      await databaseApi.getLowAttendance({ threshold: settings.lowAttendanceThreshold, campusMatch: campusFilter(req.user, req.query.campus) }),
    );
  });

  return router;
};
