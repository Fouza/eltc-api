import { programsCollection, groupsCollection } from '../../../models/index.js';
import { conflict } from '../../../helpers/errors.js';

const deleteProgram = async (id) => {
  if (await groupsCollection.exists({ program: id })) throw conflict('This program has groups. Deactivate it instead.');
  await programsCollection.deleteOne({ _id: id });
  return { ok: true };
};

export default deleteProgram;
