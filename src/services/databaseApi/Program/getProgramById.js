import { programsCollection } from '../../../models/index.js';

const getProgramById = (id) => programsCollection.findById(id).populate('language', 'name code color').lean();

export default getProgramById;
