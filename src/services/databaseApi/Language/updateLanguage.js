import { languagesCollection } from '../../../models/index.js';

const updateLanguage = (id, data) => languagesCollection.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true }).lean();

export default updateLanguage;
