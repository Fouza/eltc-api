import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN } from '../constants/roles.js';
import { notFound } from '../helpers/errors.js';

export default () => {
  const router = Router();
  router.param('id', validateObjectId);

  router.get('/', async (req, res) => {
    const filter = {};
    if (req.query.active) filter.active = req.query.active === 'true';
    if (req.query.campus) filter.campusIds = req.query.campus;
    res.json(await databaseApi.getTeachers(filter));
  });

  router.get('/:id', async (req, res) => {
    const teacher = await databaseApi.getTeacherById(req.params.id);
    if (!teacher) throw notFound('Teacher not found');
    const groups = await databaseApi.getGroups({ teacher: req.params.id });
    res.json({ ...teacher, groups });
  });

  router.post('/', requireRoles(CAN.manageTeachers), async (req, res) => {
    res.status(201).json(await databaseApi.insertTeacher(req.body));
  });

  router.put('/:id', requireRoles(CAN.manageTeachers), async (req, res) => {
    res.json(await databaseApi.updateTeacher(req.params.id, req.body));
  });

  router.delete('/:id', requireRoles(CAN.manageTeachers), async (req, res) => {
    res.json(await databaseApi.deleteTeacher(req.params.id));
  });

  return router;
};
