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
  router.use(requireRoles(CAN.viewFinance));

  router.get('/', async (req, res) => {
    res.json(await databaseApi.getInvoices(req.query, req.user));
  });

  router.get('/:id', async (req, res) => {
    const invoice = await databaseApi.getInvoiceById(req.params.id);
    if (!invoice) throw notFound('Invoice not found');
    assertCampusAccess(req.user, invoice.campus?._id);
    res.json(invoice);
  });

  router.post('/', requireRoles(CAN.manageInvoices), async (req, res) => {
    res.status(201).json(await databaseApi.insertInvoice(req.body, req.user_id));
  });

  router.put('/:id', requireRoles(CAN.manageInvoices), async (req, res) => {
    res.json(await databaseApi.updateInvoice(req.params.id, req.body));
  });

  router.post('/:id/cancel', requireRoles(CAN.manageInvoices), async (req, res) => {
    res.json(await databaseApi.cancelInvoice(req.params.id));
  });

  return router;
};
