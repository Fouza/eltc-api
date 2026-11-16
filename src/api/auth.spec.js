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
    const res = await admin.post('/users', { firstName: 'New', lastName: 'Staff', email: 'new@test.io', password: 'Password123', roles: ['accountant'] });
    expect(res.status).toBe(201);
    expect(res.body.password).toBeUndefined();
    const token = await loginAs('new@test.io');
    expect(token).toBeTruthy();
    await admin.put(`/users/${res.body._id}`, { active: false });
    expect((await api(token).get('/me')).status).toBe(401);
  });

  it('hides finance from roles without access', async () => {
    const coord = api(await loginAs('coord@test.io'));
    expect((await coord.get('/invoices')).status).toBe(403);
    const dash = await coord.get('/dashboard');
    expect(dash.status).toBe(200);
    expect(dash.body.finance).toBeUndefined();
  });
});
