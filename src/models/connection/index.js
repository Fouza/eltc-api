import mongoose from 'mongoose';
import config, { isProd } from '../../config.js';

// autoIndex is off in production: run `npm run sync-indexes` deliberately after a schema change.
export const connectDb = async (uri = config.mongoUri) => {
  if (!uri) throw new Error('MONGODB_URI is not set (copy .env.example to .env)');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { autoIndex: !isProd });
  return mongoose.connection;
};

export const disconnectDb = () => mongoose.disconnect();

export const initializeDb = async (callback) => {
  const db = await connectDb();
  return callback ? callback(db) : db;
};
