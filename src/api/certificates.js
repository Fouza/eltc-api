import { Router } from 'express';
import * as databaseApi from '../services/databaseApi/index.js';
import requireRoles from '../middleware/requireRoles.js';
import validateObjectId from '../middleware/validateObjectId.js';
import { CAN } from '../constants/roles.js';
import { badRequest, notFound } from '../helpers/errors.js';
import { assertCampusAccess } from '../helpers/campusScope.js';
import { certificatesCollection } from '../models/index.js';

const idList = (v) => String(v ?? '').split(',').map((s) => s.trim()).filter((s) => /^[a-f0-9]{24}$/i.test(s));

// Certificates of the students who passed a level: to issue → ready to collect → handed over (or revoked).
// The public verification route (QR code) is mounted separately, before the login check (see api/index.js).
export default () => {
  const router = Router();
  router.param('id', validateObjectId);
  router.use(requireRoles(CAN.manageCertificates));

  const ownCertificate = async (req) => {
    const cert = await certificatesCollection.findById(req.params.id, { campus: 1 }).lean();
    if (!cert) throw notFound('Certificate not found');
    assertCampusAccess(req.user, cert.campus);
  };

  router.get('/', async (req, res) => res.json(await databaseApi.getCertificates(req.query, req.user)));
  router.get('/candidates', async (req, res) => res.json(await databaseApi.getCertificateCandidates(req.query, req.user)));
  router.get('/stats', async (req, res) => res.json(await databaseApi.getCertificateStats(req.query, req.user)));
  router.get('/print', async (req, res) => {
    const ids = idList(req.query.ids);
    if (!ids.length) throw badRequest('No certificate chosen');
    res.json(await databaseApi.getCertificatesByIds(ids, req.user));
  });

  router.post('/', async (req, res) => res.status(201).json(await databaseApi.issueCertificates(req.body, req.user)));
  router.post('/printed', async (req, res) => res.json(await databaseApi.markCertificatesPrinted(idList((req.body.ids ?? []).join(',')))));

  router.post('/:id/handover', async (req, res) => {
    await ownCertificate(req);
    res.json(await databaseApi.handOverCertificate(req.params.id, req.body, req.user_id));
  });
  router.delete('/:id/handover', async (req, res) => {
    await ownCertificate(req);
    res.json(await databaseApi.undoCertificateHandover(req.params.id));
  });
  router.post('/:id/revoke', requireRoles(CAN.revokeCertificates), async (req, res) => {
    await ownCertificate(req);
    res.json(await databaseApi.revokeCertificate(req.params.id, req.body, req.user_id));
  });

  return router;
};
