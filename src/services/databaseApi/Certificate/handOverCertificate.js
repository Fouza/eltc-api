import { certificatesCollection } from '../../../models/index.js';
import { badRequest, notFound } from '../../../helpers/errors.js';
import { CERTIFICATE_RECEIVERS } from '../../../constants/enums.js';

// Records who collected the certificate, when, and which staff member gave it.
const handOverCertificate = async (id, { receiver = 'student', handedOverTo, handedOverAt, notes } = {}, userId) => {
  const cert = await certificatesCollection.findById(id).lean();
  if (!cert) throw notFound('Certificate not found');
  if (cert.status === 'revoked') throw badRequest('This certificate was revoked');
  if (!CERTIFICATE_RECEIVERS.includes(receiver)) throw badRequest('Unknown receiver');
  const name = receiver === 'student' ? cert.studentName : handedOverTo?.trim();
  if (!name) throw badRequest('Type the name of the person who collected it');
  return certificatesCollection
    .findByIdAndUpdate(
      id,
      { $set: { status: 'handed', receiver, handedOverTo: name, handedOverAt: handedOverAt ? new Date(handedOverAt) : new Date(), handedOverBy: userId, ...(notes !== undefined ? { notes } : {}) } },
      { returnDocument: 'after' },
    )
    .lean();
};

export default handOverCertificate;
