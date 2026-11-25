import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { disconnectDb } from '../models/connection/index.js';
import { resetDb, seedBasics, loginAs, api } from '../testData/fixtures.js';

describe('a payment larger than the invoice', () => {
  let admin, ctx, invoices;
  beforeAll(async () => {
    await resetDb();
    ctx = await seedBasics();
    admin = api(await loginAs('admin@test.io'));
    const st = await admin.post('/students', { firstName: 'Mira', lastName: 'D', campus: ctx.campusA._id });
    // 30 000 for 12 weeks → 3 blocks of 10 000
    invoices = (await admin.post('/enrollments', { studentId: st.body._id, groupId: ctx.group._id, fee: 30000 })).body.invoices;
  });
  afterAll(disconnectDb);

  it('pays the chosen block, then the next ones in order, on one receipt', async () => {
    const res = await admin.post('/payments', { invoiceId: invoices[0]._id, amount: 25000, method: 'cash' });
    expect(res.status).toBe(201);
    expect(res.body.total).toBe(25000);
    expect(res.body.lines.map((l) => l.amount)).toEqual([10000, 10000, 5000]);
    expect(res.body.lines.map((l) => l.receiptNumber)).toEqual([res.body.receiptNumber, `${res.body.receiptNumber}-2`, `${res.body.receiptNumber}-3`]);
    const statuses = await Promise.all(invoices.map(async (i) => (await admin.get(`/invoices/${i._id}`)).body.status));
    expect(statuses).toEqual(['paid', 'paid', 'partial']);
    // The receipt opened from any of its lines shows the whole payment.
    expect((await admin.get(`/payments/${res.body.lines[2]._id}`)).body.total).toBe(25000);
  });

  it('refuses more than everything the student owes', async () => {
    const res = await admin.post('/payments', { invoiceId: invoices[2]._id, amount: 6000 });
    expect(res.status).toBe(400);
    expect(res.body.errorMessage).toMatch(/5000/);
  });

  it('deleting the receipt removes all its lines and reopens the invoices', async () => {
    const { body } = await admin.get('/payments');
    const first = body.items.find((p) => p.receiptNumber.split('-').length === 3);
    expect((await admin.delete(`/payments/${first._id}`)).body).toEqual({ ok: true, deleted: 3 });
    const statuses = await Promise.all(invoices.map(async (i) => (await admin.get(`/invoices/${i._id}`)).body.status));
    expect(statuses).toEqual(['unpaid', 'unpaid', 'unpaid']);
  });
});
