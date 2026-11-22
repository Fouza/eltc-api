import { programsCollection } from '../../../models/index.js';
import buildDefaultLevels from './buildDefaultLevels.js';
import getProgramById from './getProgramById.js';

const insertProgram = async ({ defaultFee, ...data }) => {
  const levels = data.levels?.length ? data.levels : buildDefaultLevels(data.audience, defaultFee);
  const program = await programsCollection.create({ ...data, levels });
  return getProgramById(program._id);
};

export default insertProgram;
