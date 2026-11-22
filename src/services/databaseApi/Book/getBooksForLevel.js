import { booksCollection } from '../../../models/index.js';

// Active books used in this level of this program: charged when a student enrolls.
const getBooksForLevel = (programId, levelNumber) =>
  booksCollection.find({ active: true, levels: { $elemMatch: { program: programId, levelNumber: Number(levelNumber) } } }, { image: 0 }).lean();

export default getBooksForLevel;
