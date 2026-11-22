import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { disconnectDb } from '../models/connection/index.js';
import { resetDb, seedBasics, loginAs, api } from '../testData/fixtures.js';

describe('groups use the fixed sessions', () => {
  let admin, ctx, kids;
  beforeAll(async () => {
    await resetDb();
    ctx = await seedBasics();
    admin = api(await loginAs('admin@test.io'));
    const res = await admin.post('/programs', { name: 'French – Children', language: ctx.program.language._id ?? ctx.program.language, audience: 'children' });
    kids = res.body;
  });
  afterAll(disconnectDb);

  const base = () => ({ name: 'Test', program: ctx.program._id, levelNumber: 1, campus: ctx.campusA._id });

  it('adults: 2 sessions on different days, schedule derived from them', async () => {
    expect((await admin.post('/groups', { ...base(), sessions: ['sat_am'] })).status).toBe(400);
    expect((await admin.post('/groups', { ...base(), sessions: ['sat_am', 'sat_pm'] })).status).toBe(400);
    expect((await admin.post('/groups', { ...base(), sessions: ['sat_mid', 'eve_tue'] })).status).toBe(400); // midday is kids only
    const res = await admin.post('/groups', { ...base(), sessions: ['eve_tue', 'sat_am'], schedule: [{ day: 1, startTime: '09:00', endTime: '10:00' }] });
    expect(res.status).toBe(201);
    expect(res.body.sessions).toEqual(['sat_am', 'eve_tue']);
    expect(res.body.schedule).toEqual([{ day: 6, startTime: '08:00', endTime: '11:00' }, { day: 2, startTime: '17:00', endTime: '19:00' }]);
  });

  it('kids: one weekend session, levels Bounce 1 → 6', async () => {
    expect(kids.levels.map((l) => l.name)).toEqual(['Bounce 1', 'Bounce 2', 'Bounce 3', 'Bounce 4', 'Bounce 5', 'Bounce 6']);
    const kidsGroup = { ...base(), program: kids._id };
    expect((await admin.post('/groups', { ...kidsGroup, sessions: ['eve_tue'] })).status).toBe(400);
    expect((await admin.post('/groups', { ...kidsGroup, sessions: ['sat_am', 'fri_am'] })).status).toBe(400);
    const res = await admin.post('/groups', { ...kidsGroup, sessions: ['sat_mid'] });
    expect(res.status).toBe(201);
    expect(res.body.schedule).toEqual([{ day: 6, startTime: '11:00', endTime: '14:00' }]);
  });
});
