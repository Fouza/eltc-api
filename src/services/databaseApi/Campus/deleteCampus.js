import { campusesCollection, groupsCollection, studentsCollection } from '../../../models/index.js';
import { conflict } from '../../../helpers/errors.js';

const deleteCampus = async (id) => {
  if ((await studentsCollection.exists({ campus: id })) || (await groupsCollection.exists({ campus: id }))) {
    throw conflict('This campus has students or groups. Mark it as closed instead.');
  }
  await campusesCollection.deleteOne({ _id: id });
  return { ok: true };
};

export default deleteCampus;
