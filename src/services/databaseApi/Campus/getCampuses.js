import { campusesCollection } from '../../../models/index.js';

const getCampuses = (filter = {}) => campusesCollection.find(filter).sort({ name: 1 }).lean();

export default getCampuses;
