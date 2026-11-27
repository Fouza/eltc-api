import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dayjs from 'dayjs';
import { disconnectDb } from '../models/connection/index.js';
import { resetDb, seedBasics, loginAs, api } from '../testData/fixtures.js';
import { groupsCollection } from '../models/index.js';

describe('low attendance alert on save', () => {
  let admin, ctx, student;
  const day = (n) => dayjs().subtract(n, 'day').format('YYYY-MM-DD');
  const absentOn = (date) => admin.put('/attendance/sheet', { groupId: ctx.group._id, date, entries: [{ student: student._id, status: 'absent' }] });
  const lowAttendance = async () => (await admin.get('/notifications')).body.items.filter((n) => n.type === 'low_attendance');

  beforeAll(async () => {
    await resetDb();
    ctx = await seedBasics();
    // This group meets every day, so any recent date is a class day.
    await groupsCollection.updateOne({ _id: ctx.group._id }, { $set: { schedule: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, startTime: '18:00', endTime: '19:30' })) } });
    admin = api(await loginAs('admin@test.io'));
    student = (await admin.post('/students', { firstName: 'Lina', lastName: 'Absent', phone: '0550', campus: ctx.campusA._id })).body;
    await admin.post('/enrollments', { studentId: student._id, groupId: ctx.group._id });
  });
  afterAll(disconnectDb);

  it('alerts on the 3rd absence, not before, and not twice', async () => {
    expect((await absentOn(day(14))).body.alertsCreated).toBe(0);
    expect((await absentOn(day(7))).body.alertsCreated).toBe(0);
    expect(await lowAttendance()).toHaveLength(0);

    expect((await absentOn(day(1))).body.alertsCreated).toBe(1);
    const [alert] = await lowAttendance();
    expect(alert.title).toBe('Lina Absent missed 3 classes');

    expect((await absentOn(day(1))).body.alertsCreated).toBe(0); // re-saving the same sheet
    expect((await absentOn(day(0))).body.alertsCreated).toBe(1); // 4th absence → new alert
    expect(await lowAttendance()).toHaveLength(2);
  });

  it('alerts list endpoint works when nobody is missing classes', async () => {
    expect((await admin.get(`/attendance/alerts?campus=${ctx.campusB._id}`)).status).toBe(200);
  });
});
