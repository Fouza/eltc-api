import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import config from '../config.js';
import { disconnectDb } from '../models/connection/index.js';
import { resetDb, seedBasics, app } from '../testData/fixtures.js';

describe('POST /api/cron/run (daily jobs for hosts without a scheduler)', () => {
  beforeAll(async () => {
    await resetDb();
    await seedBasics();
    config.cronSecret = 'test-cron-secret';
  });
  afterAll(disconnectDb);

  it('refuses a missing or wrong secret', async () => {
    expect((await request(app).post('/api/cron/run')).status).toBe(401);
    expect((await request(app).post('/api/cron/run').set('x-cron-secret', 'nope')).status).toBe(401);
  });

  it('runs every job with the right secret', async () => {
    const res = await request(app).post('/api/cron/run').set('x-cron-secret', 'test-cron-secret');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.results)).toEqual(expect.arrayContaining(['runOverduePayments', 'runLowBookStock', 'runGroupLifecycle']));
  });
});
