// Creates/updates the indexes declared in the schemas. Run deliberately in production (autoIndex is off there).
import mongoose from 'mongoose';
import '../models/index.js';
import { initializeDb, disconnectDb } from '../models/connection/index.js';

await initializeDb();
for (const model of Object.values(mongoose.models)) {
  const dropped = await model.syncIndexes();
  console.log(`${model.modelName}: synced${dropped.length ? `, dropped ${dropped.join(', ')}` : ''}`);
}
await disconnectDb();
