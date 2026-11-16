import { groupsCollection, enrollmentsCollection } from '../../../models/index.js';
import { conflict } from '../../../helpers/errors.js';

const deleteGroup = async (id) => {
  if (await enrollmentsCollection.exists({ group: id })) throw conflict('This group has students. Cancel it instead.');
  await groupsCollection.deleteOne({ _id: id });
  return { ok: true };
};

export default deleteGroup;
