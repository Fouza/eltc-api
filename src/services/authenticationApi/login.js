import bcrypt from 'bcrypt';
import * as databaseApi from '../databaseApi/index.js';
import { unauthorized, badRequest } from '../../helpers/errors.js';
import generateToken from './generateToken.js';

const login = async ({ email, password } = {}) => {
  if (!email || !password) throw badRequest('Email and password are required');
  const user = await databaseApi.getUserByEmailWithPassword(email);
  // Same message for unknown email and wrong password.
  if (!user || !(await bcrypt.compare(password, user.password))) throw unauthorized('Wrong email or password');
  if (!user.active) throw unauthorized('This account is disabled');
  await databaseApi.touchUserLogin(user._id);
  return { token: generateToken(user), user: await databaseApi.getUserById(user._id) };
};

export default login;
