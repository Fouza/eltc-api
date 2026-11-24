import { certificatesCollection } from '../../../models/index.js';
import certificateFilters from './certificateFilters.js';
import getStudentBalances from '../Student/getStudentBalances.js';

// Issued certificates. status: ready | handed | revoked (default: everything). Ready ones come with the student's balance.
const getCertificates = async (query = {}, user) => {
  const filter = await certificateFilters(query, user);
  if (!filter) return [];
  if (query.status) filter.status = { $in: String(query.status).split(',') };
  if (query.q?.trim() && /^cert-/i.test(query.q.trim())) {
    delete filter.student;
    filter.number = query.q.trim().toUpperCase();
  }
  const rows = await certificatesCollection
    .find(filter)
    .populate('student', 'firstName lastName studentNumber phone guardian')
    .populate('campus', 'name code')
    .populate('handedOverBy', 'firstName lastName')
    .populate('issuedBy', 'firstName lastName')
    .sort(query.status === 'handed' ? { handedOverAt: -1 } : { issuedAt: -1 })
    .limit(500)
    .lean();
  const balances = await getStudentBalances(rows.filter((r) => r.status === 'ready').map((r) => r.student?._id).filter(Boolean));
  return rows.map((r) => ({ ...r, balance: balances[String(r.student?._id)] ?? { due: 0, overdue: 0 } }));
};

export default getCertificates;
