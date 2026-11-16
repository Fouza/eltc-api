import { languagesCollection } from '../../../models/index.js';

const insertLanguage = async (data) => (await languagesCollection.create(data)).toObject();

export default insertLanguage;
