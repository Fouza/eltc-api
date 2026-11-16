import { languagesCollection, programsCollection } from '../../../models/index.js';
import { conflict } from '../../../helpers/errors.js';

const deleteLanguage = async (id) => {
  if (await programsCollection.exists({ language: id })) throw conflict('This language has programs. Deactivate it instead.');
  await languagesCollection.deleteOne({ _id: id });
  return { ok: true };
};

export default deleteLanguage;
