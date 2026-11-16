// Runs every scheduler job once, now. Handy locally and for a demo: npm run run-jobs
import { initializeDb, disconnectDb } from '../models/connection/index.js';
import { runners } from '../scheduler/jobs/index.js';

await initializeDb();
for (const [name, run] of Object.entries(runners)) console.log(name, await run());
await disconnectDb();
