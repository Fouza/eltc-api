import { groupsCollection, programsCollection } from '../../../models/index.js';
import { badRequest } from '../../../helpers/errors.js';
import getGroupById from './getGroupById.js';

const insertGroup = async (data) => {
  const program = await programsCollection.findById(data.program).lean();
  if (!program) throw badRequest('Unknown program');
  if (!program.levels.some((l) => l.number === Number(data.levelNumber))) throw badRequest('This level does not exist in the program');
  const group = await groupsCollection.create(data);
  return getGroupById(group._id);
};

export default insertGroup;
