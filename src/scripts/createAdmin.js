// Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD: npm run create-admin
import config from '../config.js';
import { initializeDb, disconnectDb } from '../models/connection/index.js';
import * as databaseApi from '../services/databaseApi/index.js';

await initializeDb();
const { email, password } = config.admin;
if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD');
if (await databaseApi.getUserByEmailWithPassword(email)) console.log(`${email} already exists`);
else {
  await databaseApi.insertUser({ firstName: 'School', lastName: 'Manager', email, password, roles: ['admin'] });
  console.log(`Admin ${email} created`);
}
await disconnectDb();
