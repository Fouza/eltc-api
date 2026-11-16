import { settingsCollection } from '../../../models/index.js';
import { pick } from '../../../helpers/strings.js';

const FIELDS = [
  'schoolName', 'currency', 'locale', 'defaultMaxScore', 'defaultPassScore', 'defaultInstallments',
  'lowAttendanceThreshold', 'overdueGraceDays', 'groupAlmostFullRatio',
];

const updateSettings = (data) =>
  settingsCollection
    .findByIdAndUpdate('school', { $set: pick(data, FIELDS) }, { upsert: true, returnDocument: 'after', runValidators: true })
    .lean();

export default updateSettings;
