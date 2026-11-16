import { usersCollection } from '../../../models/index.js';

const getUsers = () => usersCollection.find({}).sort({ active: -1, firstName: 1 }).populate('campusIds', 'name code color').lean();

export default getUsers;
