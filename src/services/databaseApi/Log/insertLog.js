import { logsCollection } from '../../../models/index.js';

// Never throws: logging must not break the request that is being logged.
const insertLog = async (log) => {
  try {
    return await logsCollection.create(log);
  } catch (err) {
    console.error('insertLog failed', err.message, log?.errorMessage);
    return null;
  }
};

export default insertLog;
