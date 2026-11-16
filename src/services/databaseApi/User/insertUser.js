import bcrypt from 'bcrypt';
import { usersCollection } from '../../../models/index.js';
import { conflict, badRequest } from '../../../helpers/errors.js';
import { pick } from '../../../helpers/strings.js';

const insertUser = async (data) => {
  if (!data.password || data.password.length < 8) throw badRequest('The password must have at least 8 characters');
  const exists = await usersCollection.exists({ email: String(data.email).toLowerCase().trim() });
  if (exists) throw conflict('A user with this email already exists');
  const user = await usersCollection.create({
    ...pick(data, ['firstName', 'lastName', 'email', 'phone', 'roles', 'campusIds', 'active']),
    password: await bcrypt.hash(data.password, 10),
  });
  const { password: _password, ...rest } = user.toObject();
  return rest;
};

export default insertUser;
