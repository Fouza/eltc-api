import { countersCollection } from '../../../models/index.js';

// getNextSequence('invoice-2026') → 1, 2, 3... (atomic)
const getNextSequence = async (key) => {
  const counter = await countersCollection.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  return counter.seq;
};

export default getNextSequence;
