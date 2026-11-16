import { Router } from 'express';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN } from '../constants/roles.js';
import * as handlers from './studentRoutes/index.js';

export default () => {
  const router = Router();
  router.param('id', validateObjectId);

  router.get('/', handlers.getStudents);
  router.get('/waiting-list', handlers.getWaitingList);
  router.get('/:id', handlers.getStudent);
  router.post('/', requireRoles(CAN.manageStudents), handlers.insertStudent);
  router.post('/import', requireRoles(CAN.manageStudents), handlers.importStudents);
  router.put('/:id', requireRoles(CAN.manageStudents), handlers.updateStudent);
  router.delete('/:id', requireRoles(CAN.deleteStudents), handlers.deleteStudent);

  return router;
};
