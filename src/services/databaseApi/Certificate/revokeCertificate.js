import { certificatesCollection } from '../../../models/index.js';
import { badRequest, notFound } from '../../../helpers/errors.js';

// Cancels a certificate issued by mistake. The verification page then shows it as revoked,
// and the student goes back to "to issue" if they still passed the level.
const revokeCertificate = async (id, { reason } = {}, userId) => {
  const cert = await certificatesCollection.findById(id).lean();
  if (!cert) throw notFound('Certificate not found');
  if (cert.status === 'revoked') throw badRequest('Already revoked');
  if (!reason?.trim()) throw badRequest('Give a reason');
  return certificatesCollection
    .findByIdAndUpdate(id, { $set: { status: 'revoked', revokedAt: new Date(), revokedReason: reason.trim(), revokedBy: userId } }, { returnDocument: 'after' })
    .lean();
};

export default revokeCertificate;
