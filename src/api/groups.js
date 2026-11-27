import { Router } from 'express';
import mongoose from 'mongoose';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN } from '../constants/roles.js';
import { notFound } from '../helpers/errors.js';
import { campusFilter, assertCampusAccess } from '../helpers/campusScope.js';

const oid = (id) => new mongoose.Types.ObjectId(String(id));

// Groups = classes (one level of one program, at one campus, with a teacher and a schedule).
export default () => {
  const router = Router();
  router.param('id', validateObjectId);

  router.get('/', async (req, res) => {
    const { status, program, level, teacher, language } = req.query;
    const filter = { ...campusFilter(req.user, req.query.campus) };
    if (status) filter.status = { $in: String(status).split(',') };
    if (program) filter.program = oid(program);
    if (level) filter.levelNumber = Number(level);
    if (teacher) filter.teacher = oid(teacher);
    if (language) filter.program = { $in: (await databaseApi.getPrograms({ language })).map((p) => p._id) };
    res.json(await databaseApi.getGroups(filter));
  });

  router.get('/:id', async (req, res) => {
    const group = await databaseApi.getGroupById(req.params.id);
    if (!group) throw notFound('Group not found');
    assertCampusAccess(req.user, group.campus?._id);
    res.json(group);
  });

  router.get('/:id/attendance', async (req, res) => {
    res.json(await databaseApi.getGroupAttendance(req.params.id));
  });

  router.post('/', requireRoles(CAN.manageGroups), async (req, res) => {
    assertCampusAccess(req.user, req.body.campus);
    res.status(201).json(await databaseApi.insertGroup(req.body));
  });

  router.put('/:id', requireRoles(CAN.manageGroups), async (req, res) => {
    res.json(await databaseApi.updateGroup(req.params.id, req.body));
  });

  router.delete('/:id', requireRoles(CAN.manageGroups), async (req, res) => {
    res.json(await databaseApi.deleteGroup(req.params.id));
  });

  // Cancel one session (holiday, Eid, teacher absent…) or restore it. Body: { date: 'YYYY-MM-DD', reason, note }.
  router.post('/:id/cancellations', requireRoles(CAN.manageGroups), async (req, res) => {
    const group = await databaseApi.getGroupById(req.params.id);
    if (!group) throw notFound('Group not found');
    assertCampusAccess(req.user, group.campus?._id);
    res.status(201).json(await databaseApi.cancelSession(req.params.id, req.body, req.user_id));
  });

  router.delete('/:id/cancellations/:date', requireRoles(CAN.manageGroups), async (req, res) => {
    const group = await databaseApi.getGroupById(req.params.id);
    if (!group) throw notFound('Group not found');
    assertCampusAccess(req.user, group.campus?._id);
    res.json(await databaseApi.restoreSession(req.params.id, req.params.date));
  });

  // End of level: move students (by default those who passed) to the next-level group.
  router.post('/:id/promote', requireRoles(CAN.manageEnrollments), async (req, res) => {
    res.json(await databaseApi.promoteGroup(req.params.id, req.body, req.user_id));
  });

  return router;
};
