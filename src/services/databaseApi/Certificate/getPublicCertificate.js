import { certificatesCollection, settingsCollection } from '../../../models/index.js';

// What the public verification page (QR code) shows: enough to confirm the certificate, nothing more (no phone, no address).
const getPublicCertificate = async (code) => {
  const c = await certificatesCollection.findOne({ code: String(code) }).lean();
  if (!c) return null;
  const settings = await settingsCollection.findById('school').lean();
  return {
    schoolName: settings?.schoolName ?? 'ELTC School',
    number: c.number,
    studentName: c.studentName,
    programName: c.programName,
    languageName: c.languageName,
    levelName: c.levelName,
    campusName: c.campusName,
    startDate: c.startDate,
    endDate: c.endDate,
    hours: c.hours,
    mention: c.mention,
    issuedAt: c.issuedAt,
    status: c.status === 'revoked' ? 'revoked' : 'valid',
    revokedAt: c.revokedAt,
  };
};

export default getPublicCertificate;
