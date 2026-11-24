import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { disconnectDb } from '../models/connection/index.js';
import { enrollmentsCollection } from '../models/index.js';
import { resetDb, seedBasics, loginAs, api, app } from '../testData/fixtures.js';

describe('certificates', () => {
  let admin, sec, ctx, passedA, passedB, failed, cert;
  beforeAll(async () => {
    await resetDb();
    ctx = await seedBasics();
    admin = api(await loginAs('admin@test.io'));
    sec = api(await loginAs('sec@test.io'));
    const enroll = async (name, group, campus, result, score) => {
      const st = await admin.post('/students', { firstName: name, lastName: 'Test', campus, birthPlace: 'Alger' });
      const { body } = await admin.post('/enrollments', { studentId: st.body._id, groupId: group, force: true });
      await enrollmentsCollection.updateOne({ _id: body.enrollment._id }, { $set: { finalResult: result, finalScore: score, status: 'completed' } });
      return body.enrollment;
    };
    passedA = await enroll('Amel', ctx.group._id, ctx.campusA._id, 'passed', 84);
    failed = await enroll('Fares', ctx.group._id, ctx.campusA._id, 'failed', 30);
    passedB = await enroll('Badis', ctx.groupB._id, ctx.campusB._id, 'passed', 61);
  });
  afterAll(disconnectDb);

  it('lists students who passed and have no certificate yet, limited to the secretary\'s campus', async () => {
    const all = await admin.get('/certificates/candidates');
    expect(all.body.map((c) => c.student.firstName).sort()).toEqual(['Amel', 'Badis']);
    const mine = await sec.get('/certificates/candidates');
    expect(mine.body.map((c) => c._id)).toEqual([passedA._id]);
    expect(mine.body[0]).toMatchObject({ mention: 'Very good', finalScore: 84 });
    expect(mine.body[0].balance.due).toBeGreaterThan(0); // owes the course: shown as a warning
    expect((await sec.get('/certificates/stats')).body).toMatchObject({ toIssue: 1, ready: 0 });
  });

  it('issues a batch once: a second issue returns the same certificate, failed students are ignored', async () => {
    const res = await sec.post('/certificates', { enrollmentIds: [passedA._id, failed._id, passedB._id] });
    expect(res.status).toBe(201);
    expect(res.body.ids).toHaveLength(1); // campus B is not the secretary's
    const again = await sec.post('/certificates', { enrollmentIds: [passedA._id] });
    expect(again.body.ids).toEqual(res.body.ids);
    const [printed] = (await sec.get(`/certificates/print?ids=${res.body.ids[0]}`)).body;
    expect(printed).toMatchObject({ number: expect.stringMatching(/^CERT-\d{4}-0001$/), studentName: 'Amel Test', levelName: 'A1', mention: 'Very good', birthPlace: 'Alger', status: 'ready' });
    cert = printed;
    expect((await sec.get('/certificates/candidates')).body).toHaveLength(0);
  });

  it('counts prints and verifies publicly from the QR code, without login', async () => {
    await sec.post('/certificates/printed', { ids: [cert._id] });
    await sec.post('/certificates/printed', { ids: [cert._id] });
    const [after] = (await sec.get(`/certificates/print?ids=${cert._id}`)).body;
    expect(after.printCount).toBe(2);
    const pub = await request(app).get(`/api/verify/${cert.code}`);
    expect(pub.status).toBe(200);
    expect(pub.body).toMatchObject({ status: 'valid', studentName: 'Amel Test', number: cert.number });
    expect(pub.body.phone).toBeUndefined();
    expect((await request(app).get('/api/verify/nope')).status).toBe(404);
  });

  it('hands over to a parent (name required), and can be undone', async () => {
    expect((await sec.post(`/certificates/${cert._id}/handover`, { receiver: 'guardian' })).status).toBe(400);
    const res = await sec.post(`/certificates/${cert._id}/handover`, { receiver: 'guardian', handedOverTo: 'Karim Test' });
    expect(res.body).toMatchObject({ status: 'handed', handedOverTo: 'Karim Test', receiver: 'guardian' });
    expect((await sec.get('/certificates?status=handed')).body).toHaveLength(1);
    const undo = await sec.delete(`/certificates/${cert._id}/handover`);
    expect(undo.body.status).toBe('ready');
    expect(undo.body.handedOverTo).toBeUndefined();
  });

  it('only the admin revokes; a revoked certificate shows as revoked and the student can get a new one', async () => {
    expect((await sec.post(`/certificates/${cert._id}/revoke`, { reason: 'Typo in the name' })).status).toBe(403);
    expect((await admin.post(`/certificates/${cert._id}/revoke`, {})).status).toBe(400);
    expect((await admin.post(`/certificates/${cert._id}/revoke`, { reason: 'Typo in the name' })).body.status).toBe('revoked');
    expect((await request(app).get(`/api/verify/${cert.code}`)).body.status).toBe('revoked');
    expect((await sec.get('/certificates/candidates')).body.map((c) => c._id)).toEqual([passedA._id]);
    const reissued = await sec.post('/certificates', { enrollmentIds: [passedA._id] });
    expect(reissued.body.ids[0]).not.toBe(cert._id);
  });

  it('the profile lists the student\'s certificates', async () => {
    const profile = await sec.get(`/students/${cert.student}`);
    expect(profile.body.certificates.map((c) => c.status).sort()).toEqual(['ready', 'revoked']);
  });
});
