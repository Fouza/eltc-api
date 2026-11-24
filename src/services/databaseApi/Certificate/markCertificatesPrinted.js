import { certificatesCollection } from '../../../models/index.js';

// Counts each print (a reprint for a lost certificate keeps the same number).
const markCertificatesPrinted = async (ids = []) => {
  await certificatesCollection.updateMany({ _id: { $in: ids }, status: { $ne: 'revoked' } }, { $inc: { printCount: 1 }, $set: { lastPrintedAt: new Date() } });
  return { ok: true };
};

export default markCertificatesPrinted;
