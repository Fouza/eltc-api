import { campusesCollection } from '../../../models/index.js';

const updateCampus = (id, data) => campusesCollection.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true }).lean();

export default updateCampus;
