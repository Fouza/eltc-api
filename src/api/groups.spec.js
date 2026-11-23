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

  it('adults: one whole schedule (weekend morning, weekend afternoon or evening), schedule derived from it', async () => {
    expect((await admin.post('/groups', { ...base(), sessions: ['sat_am'] })).status).toBe(400);
    expect((await admin.post('/groups', { ...base(), sessions: ['sat_am', 'eve_tue'] })).status).toBe(400);
    expect((await admin.post('/groups', { ...base(), sessions: ['eve_sun', 'eve_tue'] })).status).toBe(400);
    const res = await admin.post('/groups', { ...base(), sessions: ['fri_am', 'sat_am'], schedule: [{ day: 1, startTime: '09:00', endTime: '10:00' }] });
    expect(res.status).toBe(201);
    expect(res.body.sessions).toEqual(['sat_am', 'fri_am']);
    expect(res.body.schedule).toEqual([{ day: 6, startTime: '08:00', endTime: '11:00' }, { day: 5, startTime: '08:30', endTime: '11:30' }]);
    const evening = await admin.post('/groups', { ...base(), sessions: ['eve_thu', 'eve_sun', 'eve_tue'] });
    expect(evening.body.schedule.map((s) => s.day)).toEqual([0, 2, 4]);
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
