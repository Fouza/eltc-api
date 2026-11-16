import { settingsCollection } from '../../../models/index.js';

const getSettings = async () => {
  const settings = await settingsCollection.findById('school').lean();
  if (settings) return settings;
  return (await settingsCollection.create({ _id: 'school' })).toObject();
};

export default getSettings;
