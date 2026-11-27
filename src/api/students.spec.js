import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { disconnectDb } from '../models/connection/index.js';
import { resetDb, seedBasics, loginAs, api } from '../testData/fixtures.js';

describe('students: second phone and preferred time', () => {
  let admin, ctx;
  beforeAll(async () => {
    await resetDb();
    ctx = await seedBasics();
    admin = api(await loginAs('admin@test.io'));
  });
  afterAll(disconnectDb);

  it('splits "a/b" typed in the phone box into phone and phone 2, and finds the student by either', async () => {
    const res = await admin.post('/students', { firstName: 'Lina', lastName: 'Test', campus: ctx.campusA._id, phone: '0550111222 / 0661333444' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ phone: '0550111222', phone2: '0661333444' });
    const upd = await admin.put(`/students/${res.body._id}`, { phone: '0550999888/0770123456', phone2: '' });
    expect(upd.body).toMatchObject({ phone: '0550999888', phone2: '0770123456' });
    const found = await admin.get('/students?q=0770123');
    expect(found.body.items.map((s) => s._id)).toContain(res.body._id);
  });

  it('keeps the preferred time on the waiting list; an unknown time is refused', async () => {
    const ok = await admin.post('/students', { firstName: 'Omar', lastName: 'Wait', campus: ctx.campusA._id, phone: '0550000001', desiredProgram: ctx.program._id, desiredLevel: 1, preferredTime: 'evening' });
    expect(ok.status).toBe(201);
    await admin.post('/students', { firstName: 'Ines', lastName: 'Wait', campus: ctx.campusA._id, phone: '0550000002', desiredProgram: ctx.program._id, desiredLevel: 1, preferredTime: '' });
    expect((await admin.post('/students', { firstName: 'X', lastName: 'Bad', campus: ctx.campusA._id, phone: '0550000003', preferredTime: 'monday_night' })).status).toBe(400);
    const list = (await admin.get('/students/waiting-list')).body;
    const bucket = list.find((b) => b.program?._id === String(ctx.program._id));
    expect(bucket.students.map((s) => [s.firstName, s.preferredTime]).sort()).toEqual([['Ines', null], ['Omar', 'evening']]);
  });
});
