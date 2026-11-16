import { languagesCollection } from '../../../models/index.js';

const getLanguages = (filter = {}) => languagesCollection.find(filter).sort({ name: 1 }).lean();

export default getLanguages;
