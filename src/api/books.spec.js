import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dayjs from 'dayjs';
import { disconnectDb } from '../models/connection/index.js';
import { groupsCollection } from '../models/index.js';
import { resetDb, seedBasics, loginAs, api } from '../testData/fixtures.js';

describe('books', () => {
  let admin, sec, ctx, book;
  beforeAll(async () => {
    await resetDb();
    ctx = await seedBasics();
    admin = api(await loginAs('admin@test.io'));
    sec = api(await loginAs('sec@test.io'));
    await groupsCollection.updateOne({ _id: ctx.group._id }, { $set: { startDate: dayjs().subtract(1, 'week').toDate(), endDate: dayjs().add(11, 'week').toDate() } });
  });
  afterAll(disconnectDb);

  const newStudent = async (name) => (await admin.post('/students', { firstName: name, lastName: 'X', campus: ctx.campusA._id })).body;

  it('the secretary adds a book to a level with stock; only the admin deletes', async () => {
    const res = await sec.post('/books', { title: 'Édito A1', price: 3800, levels: [{ program: ctx.program._id, levelNumber: 1 }], stock: [{ campus: ctx.campusA._id, quantity: 10 }] });
    expect(res.status).toBe(201);
    book = res.body;
    const forLevel = await sec.get(`/books?program=${ctx.program._id}&level=1`);
    expect(forLevel.body.map((b) => b.title)).toEqual(['Édito A1']);
    expect((await sec.delete(`/books/${book._id}`)).status).toBe(403);
  });

  it('enrolling charges the book without discount, overdue only when the level ends', async () => {
    const st = await newStudent('Book');
    const { body } = await sec.post('/enrollments', { studentId: st._id, groupId: ctx.group._id, discount: 3000 });
    const bookInv = body.invoices.find((i) => i.kind === 'book');
    expect(bookInv).toMatchObject({ label: 'Édito A1', amount: 3800, group: String(ctx.group._id) });
    expect(dayjs(bookInv.overdueAt).isAfter(dayjs().add(10, 'week'))).toBe(true);
    const books = await sec.get(`/invoices?kind=book&group=${ctx.group._id}`);
    expect(books.body.items).toHaveLength(1);
    const courses = await sec.get(`/invoices?kind=course&student=${st._id}`);
    expect(courses.body.items.every((i) => i.kind === 'course')).toBe(true);
  });

  it('a student who already has the book is not charged', async () => {
    const st = await newStudent('Has');
    const { body } = await sec.post('/enrollments', { studentId: st._id, groupId: ctx.group._id, books: [], force: true });
    expect(body.invoices.some((i) => i.kind === 'book')).toBe(false);
  });

  it('handing over takes a copy out of the campus stock; leaving cancels only books not handed over', async () => {
    const a = await newStudent('A');
    const b = await newStudent('B');
    const ea = (await sec.post('/enrollments', { studentId: a._id, groupId: ctx.group._id, force: true })).body;
    const eb = (await sec.post('/enrollments', { studentId: b._id, groupId: ctx.group._id, force: true })).body;
    const invA = ea.invoices.find((i) => i.kind === 'book');
    const invB = eb.invoices.find((i) => i.kind === 'book');
    expect((await sec.post(`/invoices/${invA._id}/handover`, { handedOver: true })).body.handedOverAt).toBeTruthy();
    expect((await sec.get(`/books/${book._id}`)).body.stock[0].quantity).toBe(9);
    await sec.put(`/enrollments/${ea.enrollment._id}`, { status: 'dropped' });
    await sec.put(`/enrollments/${eb.enrollment._id}`, { status: 'dropped' });
    expect((await sec.get(`/invoices/${invA._id}`)).body.status).toBe('unpaid'); // has the book: still owed
    expect((await sec.get(`/invoices/${invB._id}`)).body.status).toBe('cancelled');
  });
});
