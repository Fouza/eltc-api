import { usersCollection } from '../../../models/index.js';

const touchUserLogin = (id) => usersCollection.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } });

export default touchUserLogin;
