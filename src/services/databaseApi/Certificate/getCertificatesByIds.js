import { certificatesCollection } from '../../../models/index.js';
import { canAccessCampus } from '../../../helpers/campusScope.js';

// Full certificates for the print page (with the campus address printed at the bottom).
const getCertificatesByIds = async (ids = [], user) => {
  const rows = await certificatesCollection.find({ _id: { $in: ids } }).populate('campus', 'name city address phone').lean();
  const order = ids.map(String);
  return rows.filter((c) => canAccessCampus(user, c.campus?._id)).sort((a, b) => order.indexOf(String(a._id)) - order.indexOf(String(b._id)));
};

export default getCertificatesByIds;
