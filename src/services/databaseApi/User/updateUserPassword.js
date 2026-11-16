import bcrypt from 'bcrypt';
import { usersCollection } from '../../../models/index.js';
import { badRequest } from '../../../helpers/errors.js';

const updateUserPassword = async (id, password) => {
  if (!password || password.length < 8) throw badRequest('The password must have at least 8 characters');
  await usersCollection.updateOne({ _id: id }, { $set: { password: await bcrypt.hash(password, 10), passwordChangedAt: new Date() } });
  return { ok: true };
};

export default updateUserPassword;
