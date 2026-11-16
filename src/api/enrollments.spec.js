import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { disconnectDb } from '../models/connection/index.js';
import { resetDb, seedBasics, loginAs, api } from '../testData/fixtures.js';

describe('register → enroll → pay → attendance → exam', () => {
  let admin, sec, ctx, student;
  beforeAll(async () => {
    await resetDb();
    ctx = await seedBasics();
    admin = api(await loginAs('admin@test.io'));
    sec = api(await loginAs('sec@test.io'));
  });
  afterAll(disconnectDb);

  it('registers a prospect with a student number', async () => {
    const res = await sec.post('/students', {
      firstName: 'Marie', lastName: 'Curie', phone: '0550123456', campus: ctx.campusA._id, desiredProgram: ctx.program._id, desiredLevel: 1,
    });
    expect(res.status).toBe(201);
    expect(res.body.studentNumber).toMatch(/^ELTC-\d{4}-0001$/);
    expect(res.body.status).toBe('prospect');
    student = res.body;
    const waiting = await sec.get('/students/waiting-list');
    expect(waiting.body[0].students).toHaveLength(1);
  });

  it('keeps a campus-limited secretary out of the other campus', async () => {
    expect((await sec.post('/students', { firstName: 'X', lastName: 'Y', campus: ctx.campusB._id })).status).toBe(403);
    expect((await sec.get(`/students?campus=${ctx.campusB._id}`)).status).toBe(403);
  });

  it('enrolls in 3 installments and leaves the waiting list', async () => {
    const res = await sec.post('/enrollments', { studentId: student._id, groupId: ctx.group._id, installments: 3, discount: 3000 });
    expect(res.status).toBe(201);
    expect(res.body.invoices).toHaveLength(3);
    expect(res.body.invoices.reduce((s, i) => s + i.amount, 0)).toBe(27000);
    const profile = await sec.get(`/students/${student._id}`);
    expect(profile.body.student.status).toBe('active');
    expect(profile.body.finance.due).toBe(27000);
    expect((await sec.post('/enrollments', { studentId: student._id, groupId: ctx.group._id })).status).toBe(409);
  });

  it('records a partial then full payment', async () => {
    const { body } = await sec.get(`/invoices?student=${student._id}`);
    const first = body.items[0];
    expect((await sec.post('/payments', { invoiceId: first._id, amount: 99999 })).status).toBe(400);
    await sec.post('/payments', { invoiceId: first._id, amount: 4000, method: 'cash' });
    let inv = await sec.get(`/invoices/${first._id}`);
    expect(inv.body.status).toBe('partial');
    const pay = await sec.post('/payments', { invoiceId: first._id, amount: 5000, method: 'card' });
    expect(pay.body.receiptNumber).toMatch(/^REC-/);
    inv = await sec.get(`/invoices/${first._id}`);
    expect(inv.body.status).toBe('paid');
    // secretary can't delete a payment, admin can
    expect((await sec.delete(`/payments/${pay.body._id}`)).status).toBe(403);
    expect((await admin.delete(`/payments/${pay.body._id}`)).status).toBe(200);
    inv = await sec.get(`/invoices/${first._id}`);
    expect(inv.body.status).toBe('partial');
  });

  it('pre-fills an attendance sheet with the roster and saves it', async () => {
    const sheet = await sec.get(`/attendance/sheet?groupId=${ctx.group._id}&date=2026-11-09`);
    expect(sheet.body.exists).toBe(false);
    expect(sheet.body.entries[0].status).toBe('present');
    const saved = await sec.put('/attendance/sheet', {
      groupId: ctx.group._id, date: '2026-11-09', topic: 'Lesson 1', entries: [{ student: student._id, status: 'absent' }],
    });
    expect(saved.body.exists).toBe(true);
    expect(saved.body.entries[0].status).toBe('absent');
  });

  it('a final exam sets the final result', async () => {
    const exam = await sec.post('/exams', { group: ctx.group._id, title: 'Final', type: 'final', date: '2026-11-10' });
    expect(exam.body.maxScore).toBe(20);
    expect((await sec.put(`/exams/${exam.body._id}/results`, { results: [{ student: student._id, score: 25 }] })).status).toBe(400);
    const res = await sec.put(`/exams/${exam.body._id}/results`, { results: [{ student: student._id, score: 14.5 }] });
    expect(res.body.status).toBe('graded');
    expect(res.body.stats.average).toBe(14.5);
    const profile = await sec.get(`/students/${student._id}`);
    expect(profile.body.enrollments[0].finalResult).toBe('passed');
  });

  it('refuses a full group unless forced', async () => {
    const other = await admin.post('/students', { firstName: 'B', lastName: 'B', campus: ctx.campusA._id });
    await admin.post('/enrollments', { studentId: other.body._id, groupId: ctx.group._id });
    const third = await admin.post('/students', { firstName: 'C', lastName: 'C', campus: ctx.campusA._id });
    expect((await admin.post('/enrollments', { studentId: third.body._id, groupId: ctx.group._id })).status).toBe(409);
    expect((await admin.post('/enrollments', { studentId: third.body._id, groupId: ctx.group._id, force: true })).status).toBe(201);
    const notifs = await admin.get('/notifications');
    expect(notifs.body.items.some((n) => n.type === 'group_almost_full')).toBe(true);
  });
});
