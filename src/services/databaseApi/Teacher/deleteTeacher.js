import { teachersCollection, groupsCollection } from '../../../models/index.js';
import { conflict } from '../../../helpers/errors.js';

const deleteTeacher = async (id) => {
  if (await groupsCollection.exists({ teacher: id })) throw conflict('This teacher is assigned to groups. Deactivate them instead.');
  await teachersCollection.deleteOne({ _id: id });
  return { ok: true };
};

export default deleteTeacher;
