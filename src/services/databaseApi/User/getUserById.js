import { usersCollection } from '../../../models/index.js';

const getUserById = (id) => usersCollection.findById(id).populate('campusIds', 'name code color').lean();

export default getUserById;
