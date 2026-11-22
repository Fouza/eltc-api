import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN, ROLES } from '../constants/roles.js';
import notify from '../services/notifications/notify.js';

export default () => {
  const router = Router();
  router.param('id', validateObjectId);

  router.get('/', async (req, res) => {
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.group) filter.group = req.query.group;
    res.json(await databaseApi.getEnrollments(filter));
  });

  // Enroll a student in a group and create the invoices.
  router.post('/', requireRoles(CAN.manageEnrollments), async (req, res) => {
    const result = await databaseApi.enrollStudent(req.body, req.user_id);
    const settings = await databaseApi.getSettings();
    const { group } = result;
    if (group.enrolledCount >= Math.ceil(group.capacity * settings.groupAlmostFullRatio)) {
      await notify({
        type: 'group_almost_full',
        severity: group.enrolledCount >= group.capacity ? 'warning' : 'info',
        title: `${group.name} is ${group.enrolledCount >= group.capacity ? 'full' : 'almost full'}`,
        message: `${group.enrolledCount} of ${group.capacity} seats taken. Consider opening a new group.`,
        link: `/groups/${group._id}`,
        campus: group.campus,
        roles: [ROLES.SECRETARY],
        dedupeKey: `group_full:${group._id}:${group.enrolledCount}`,
      });
    }
    res.status(201).json(result);
  });

  router.put('/:id', requireRoles(CAN.manageEnrollments), async (req, res) => {
    res.json(await databaseApi.updateEnrollment(req.params.id, req.body));
  });

  router.post('/:id/transfer', requireRoles(CAN.manageEnrollments), async (req, res) => {
    res.json(await databaseApi.transferEnrollment(req.params.id, req.body.groupId, req.user_id));
  });

  return router;
};
