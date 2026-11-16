import { usersCollection } from '../../../models/index.js';
import { pick } from '../../../helpers/strings.js';

const updateUser = (id, data, fields = ['firstName', 'lastName', 'email', 'phone', 'roles', 'campusIds', 'active']) =>
  usersCollection
    .findByIdAndUpdate(id, { $set: pick(data, fields) }, { returnDocument: 'after', runValidators: true })
    .populate('campusIds', 'name code color')
    .lean();

export default updateUser;
