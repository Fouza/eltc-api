import { programsCollection } from '../../../models/index.js';

const getPrograms = (filter = {}) =>
  programsCollection.find(filter).populate('language', 'name code color').sort({ name: 1 }).lean();

export default getPrograms;
