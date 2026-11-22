import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN } from '../constants/roles.js';
import { notFound } from '../helpers/errors.js';

// Books sold to students: price, picture, the program levels that use them, stock per campus.
export default () => {
  const router = Router();
  router.param('id', validateObjectId);

  router.get('/', async (req, res) => {
    res.json(await databaseApi.getBooks(req.query));
  });

  router.get('/:id', async (req, res) => {
    const book = await databaseApi.getBookById(req.params.id);
    if (!book) throw notFound('Book not found');
    res.json(book);
  });

  router.post('/', requireRoles(CAN.manageBooks), async (req, res) => {
    res.status(201).json(await databaseApi.insertBook(req.body));
  });

  router.put('/:id', requireRoles(CAN.manageBooks), async (req, res) => {
    res.json(await databaseApi.updateBook(req.params.id, req.body));
  });

  router.post('/:id/stock', requireRoles(CAN.manageBooks), async (req, res) => {
    res.json(await databaseApi.adjustBookStock(req.params.id, req.body));
  });

  router.delete('/:id', requireRoles(CAN.deleteBooks), async (req, res) => {
    res.json(await databaseApi.deleteBook(req.params.id));
  });

  return router;
};
