import { usersCollection } from '../../../models/index.js';

const getUserByEmailWithPassword = (email) =>
  usersCollection.findOne({ email: String(email).toLowerCase().trim() }).select('+password').lean();

export default getUserByEmailWithPassword;
