import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { disconnectDb } from '../models/connection/index.js';
import { app, resetDb, seedBasics, loginAs, api } from '../testData/fixtures.js';

describe('auth and roles', () => {
  let admin, sec;
  beforeAll(async () => {
    await resetDb();
    await seedBasics();
    admin = api(await loginAs('admin@test.io'));
    sec = api(await loginAs('sec@test.io'));
  });
  afterAll(disconnectDb);

  it('rejects a wrong password with the same message as an unknown email', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: 'admin@test.io', password: 'nope' });
    const b = await request(app).post('/api/auth/login').send({ email: 'ghost@test.io', password: 'nope' });
    expect(a.status).toBe(401);
    expect(a.body.errorMessage).toBe(b.body.errorMessage);
  });

  it('requires a token', async () => {
    expect((await request(app).get('/api/students')).status).toBe(401);
  });

  it('only lets the admin manage users', async () => {
    expect((await admin.get('/users')).status).toBe(200);
    expect((await sec.get('/users')).status).toBe(403);
  });

  it('admin creates a staff account that can log in, then disables it', async () => {
    const res = await admin.post('/users', { firstName: 'New', lastName: 'Staff', email: 'new@test.io', password: 'Password123', roles: ['secretary'] });
    expect(res.status).toBe(201);
    expect(res.body.password).toBeUndefined();
    const token = await loginAs('new@test.io');
    expect(token).toBeTruthy();
    await admin.put(`/users/${res.body._id}`, { active: false });
    expect((await api(token).get('/me')).status).toBe(401);
  });

  it('keeps settings, campuses and the dashboard for the admin, the daily work open to the secretary', async () => {
    expect((await sec.put('/settings', { groupAlmostFullRatio: 0.5 })).status).toBe(403);
    expect((await sec.get('/settings')).status).toBe(200); // school name, currency… are read by every screen
    expect((await sec.post('/campuses', { name: 'X', code: 'X' })).status).toBe(403);
    expect((await sec.get('/invoices')).status).toBe(200);
    expect((await sec.get('/dashboard')).status).toBe(403);
    const dash = await admin.get('/dashboard');
    expect(dash.status).toBe(200);
    expect(dash.body.finance).toBeDefined();
  });
});
