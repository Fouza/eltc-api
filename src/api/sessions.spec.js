import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { disconnectDb } from '../models/connection/index.js';
import { groupsCollection, invoicesCollection, programsCollection } from '../models/index.js';
import { resetDb, seedBasics, loginAs, api } from '../testData/fixtures.js';

// Kids group on Saturdays from 2026-09-19, Bounce-like level: 16 weeks, 12 000 → 4 blocks of 3 000.
describe('cancelled sessions', () => {
  let admin, sec, ctx, group, student;
  const d = (x) => x?.slice(0, 10);
  const invoices = async () => (await invoicesCollection.find({ student: student._id, kind: 'course' }).sort({ dueDate: 1 }).lean()).map((i) => [i.dueDate.toISOString().slice(0, 10), i.overdueAt.toISOString().slice(0, 10)]);

  beforeAll(async () => {
    await resetDb();
    ctx = await seedBasics();
    admin = api(await loginAs('admin@test.io'));
    sec = api(await loginAs('sec@test.io'));
    await programsCollection.updateOne({ _id: ctx.program._id }, { $set: { audience: 'children', 'levels.0.durationWeeks': 16, 'levels.0.fee': 12000 } });
    group = (await admin.post('/groups', { name: 'Kids Sat', program: ctx.program._id, levelNumber: 1, campus: ctx.campusA._id, sessions: ['sat_am'], startDate: '2026-09-19', endDate: '2027-01-09', status: 'ongoing' })).body;
    student = (await admin.post('/students', { firstName: 'Rayan', lastName: 'Eid', phone: '0550', campus: ctx.campusA._id })).body;
    await admin.post('/enrollments', { studentId: student._id, groupId: group._id, enrolledAt: '2026-09-19' });
  });
  afterAll(disconnectDb);

  it('a cancelled Saturday pushes the blocks after it and the end of the level one week later', async () => {
    expect(await invoices()).toEqual([['2026-09-19', '2026-10-17'], ['2026-10-17', '2026-11-14'], ['2026-11-14', '2026-12-12'], ['2026-12-12', '2027-01-09']]);
    const res = await sec.post(`/groups/${group._id}/cancellations`, { date: '2026-10-31', reason: 'eid', note: 'Mawlid' });
    expect(res.status).toBe(201);
    expect(res.body.invoicesMoved).toBe(3);
    expect(await invoices()).toEqual([['2026-09-19', '2026-10-17'], ['2026-10-17', '2026-11-21'], ['2026-11-21', '2026-12-19'], ['2026-12-19', '2027-01-16']]);
    expect(d((await groupsCollection.findById(group._id).lean()).endDate.toISOString())).toBe('2027-01-16');
  });

  it('no attendance on a cancelled session, outside the group dates, or on a day without class', async () => {
    const save = (date) => sec.put('/attendance/sheet', { groupId: group._id, date, entries: [] });
    expect((await save('2026-10-31')).status).toBe(400);
    expect((await save('2026-09-12')).body.errorMessage).toMatch(/starts on/);
    expect((await save('2026-10-30')).status).toBe(400); // a Friday
    expect((await save('2026-10-24')).status).toBe(200);
    expect((await sec.get(`/attendance/sheet?groupId=${group._id}&date=2026-10-31`)).body).toMatchObject({ noSession: 'This session was cancelled', cancelled: { reason: 'eid' } });
    // a session with attendance can't be cancelled
    expect((await sec.post(`/groups/${group._id}/cancellations`, { date: '2026-10-24', reason: 'holiday' })).status).toBe(409);
  });

  it('a student enrolled after the cancellation gets the moved dates; restoring moves everything back', async () => {
    const late = (await admin.post('/students', { firstName: 'Sami', lastName: 'Late', phone: '0551', campus: ctx.campusA._id })).body;
    await admin.post('/enrollments', { studentId: late._id, groupId: group._id, enrolledAt: '2026-09-19' });
    const lateDates = (await invoicesCollection.find({ student: late._id, kind: 'course' }).sort({ dueDate: 1 }).lean()).map((i) => i.overdueAt.toISOString().slice(0, 10));
    expect(lateDates).toEqual(['2026-10-17', '2026-11-21', '2026-12-19', '2027-01-16']);
    expect((await sec.delete(`/groups/${group._id}/cancellations/2026-10-31`)).status).toBe(200);
    expect(await invoices()).toEqual([['2026-09-19', '2026-10-17'], ['2026-10-17', '2026-11-14'], ['2026-11-14', '2026-12-12'], ['2026-12-12', '2027-01-09']]);
    expect(d((await groupsCollection.findById(group._id).lean()).endDate.toISOString())).toBe('2027-01-09');
  });
});
