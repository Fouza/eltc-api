import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN } from '../constants/roles.js';
import { notFound } from '../helpers/errors.js';
import { assertCampusAccess } from '../helpers/campusScope.js';

export default () => {
  const router = Router();
  router.param('id', validateObjectId);

  router.get('/', async (req, res) => {
    res.json(await databaseApi.getExams(req.query, req.user));
  });

  router.get('/:id', async (req, res) => {
    const exam = await databaseApi.getExamById(req.params.id);
    if (!exam) throw notFound('Exam not found');
    assertCampusAccess(req.user, exam.campus?._id);
    res.json(exam);
  });

  router.post('/', requireRoles(CAN.manageExams), async (req, res) => {
    res.status(201).json(await databaseApi.insertExam(req.body, req.user_id));
  });

  router.put('/:id', requireRoles(CAN.manageExams), async (req, res) => {
    res.json(await databaseApi.updateExam(req.params.id, req.body));
  });

  router.put('/:id/results', requireRoles(CAN.manageExams), async (req, res) => {
    res.json(await databaseApi.saveExamResults(req.params.id, req.body.results, req.user_id));
  });

  router.delete('/:id', requireRoles(CAN.manageExams), async (req, res) => {
    res.json(await databaseApi.deleteExam(req.params.id));
  });

  return router;
};
