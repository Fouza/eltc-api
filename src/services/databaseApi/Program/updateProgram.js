import { programsCollection } from '../../../models/index.js';
import getProgramById from './getProgramById.js';

const updateProgram = async (id, data) => {
  if (data.levels) data.levels = data.levels.map((l, i) => ({ ...l, number: i + 1 }));
  await programsCollection.updateOne({ _id: id }, { $set: data }, { runValidators: true });
  return getProgramById(id);
};

export default updateProgram;
