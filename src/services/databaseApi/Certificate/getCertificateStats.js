import dayjs from 'dayjs';
import { certificatesCollection, enrollmentsCollection } from '../../../models/index.js';
import certificateFilters, { certifiedEnrollmentIds } from './certificateFilters.js';

// Numbers for the cards at the top of the page.
const getCertificateStats = async (query = {}, user) => {
  const filter = (await certificateFilters({ campus: query.campus }, user)) ?? {};
  const done = await certifiedEnrollmentIds();
  const longAgo = dayjs().subtract(30, 'day').toDate();
  const [toIssue, ready, waitingLong, handedThisMonth] = await Promise.all([
    enrollmentsCollection.countDocuments({ ...filter, finalResult: 'passed', _id: { $nin: done } }),
    certificatesCollection.countDocuments({ ...filter, status: 'ready' }),
    certificatesCollection.countDocuments({ ...filter, status: 'ready', issuedAt: { $lt: longAgo } }),
    certificatesCollection.countDocuments({ ...filter, status: 'handed', handedOverAt: { $gte: dayjs().startOf('month').toDate() } }),
  ]);
  return { toIssue, ready, waitingLong, handedThisMonth };
};

export default getCertificateStats;
