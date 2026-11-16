import { programsCollection } from '../../../models/index.js';
import buildDefaultLevels from './buildDefaultLevels.js';
import getProgramById from './getProgramById.js';

const insertProgram = async ({ levelCount, defaultFee, ...data }) => {
  const levels = data.levels?.length ? data.levels : buildDefaultLevels(levelCount, defaultFee);
  const program = await programsCollection.create({ ...data, levels });
  return getProgramById(program._id);
};

export default insertProgram;
