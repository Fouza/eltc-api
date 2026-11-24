import { certificatesCollection } from '../../../models/index.js';
import { badRequest, notFound } from '../../../helpers/errors.js';

// For a click made by mistake: back to "ready to collect".
const undoCertificateHandover = async (id) => {
  const cert = await certificatesCollection.findById(id).lean();
  if (!cert) throw notFound('Certificate not found');
  if (cert.status !== 'handed') throw badRequest('This certificate was not handed over');
  return certificatesCollection
    .findByIdAndUpdate(id, { $set: { status: 'ready' }, $unset: { receiver: '', handedOverTo: '', handedOverAt: '', handedOverBy: '' } }, { returnDocument: 'after' })
    .lean();
};

export default undoCertificateHandover;
