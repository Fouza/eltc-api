import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN } from '../constants/roles.js';
import { notFound } from '../helpers/errors.js';
import { assertCampusAccess } from '../helpers/campusScope.js';
import { socketIO } from '../socket.js';
import { PAYMENT_RECORDED } from '../constants/events.js';

export default () => {
  const router = Router();
  router.param('id', validateObjectId);
  router.use(requireRoles(CAN.viewFinance));

  router.get('/', async (req, res) => {
    res.json(await databaseApi.getPayments(req.query, req.user));
  });

  // Receipt.
  router.get('/:id', async (req, res) => {
    const payment = await databaseApi.getPaymentById(req.params.id);
    if (!payment) throw notFound('Payment not found');
    assertCampusAccess(req.user, payment.campus?._id);
    res.json(payment);
  });

  router.post('/', requireRoles(CAN.recordPayments), async (req, res) => {
    const payment = await databaseApi.insertPayment(req.body, req.user_id);
    socketIO.to('staff').emit(PAYMENT_RECORDED, { _id: payment._id, student: payment.student?._id, amount: payment.amount });
    res.status(201).json(payment);
  });

  router.delete('/:id', requireRoles(CAN.deletePayments), async (req, res) => {
    res.json(await databaseApi.deletePayment(req.params.id));
  });

  return router;
};
