// Separate process (Procfile "scheduler"): connect to the database, start every cron job.
import { initializeDb, disconnectDb } from '../models/connection/index.js';
import { cronJobs } from './jobs/index.js';

initializeDb(() => {
  Object.entries(cronJobs).forEach(([name, job]) => {
    job.start();
    console.log(`[scheduler] ${name} started (${job.cronTime.source})`);
  });
  let stopping = false;
  const stop = async () => {
    if (stopping) return process.exit(1);
    stopping = true;
    setTimeout(() => process.exit(1), 5000).unref();
    Object.values(cronJobs).forEach((job) => job.stop());
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}).catch((err) => {
  console.error('Scheduler failed to start', err);
  process.exit(1);
});
