import mongoose from 'mongoose';
import request from 'supertest';
import { connectDb } from '../models/connection/index.js';
import * as m from '../models/index.js';
import * as databaseApi from '../services/databaseApi/index.js';
import { createApp } from '../app.js';

export const app = createApp();

export const resetDb = async () => {
  await connectDb();
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
};

export const loginAs = async (email, password = 'Password123') => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
};

// Two campuses, one program with 6 levels, one ongoing group, an admin and a secretary limited to campus A.
export const seedBasics = async () => {
  const [campusA, campusB] = await m.campusesCollection.insertMany([
    { name: 'Campus A', code: 'A' },
    { name: 'Campus B', code: 'B' },
  ]);
  const language = await m.languagesCollection.create({ name: 'French', code: 'fr' });
  const program = await databaseApi.insertProgram({ name: 'French – Adults', language: language._id, audience: 'adults', defaultFee: 30000 });
  const group = await m.groupsCollection.create({
    name: 'FR-1', program: program._id, levelNumber: 1, campus: campusA._id, capacity: 2, status: 'ongoing', schedule: [{ day: 1, startTime: '18:00', endTime: '19:30' }],
  });
  const groupB = await m.groupsCollection.create({ name: 'FR-1 B', program: program._id, levelNumber: 1, campus: campusB._id, status: 'ongoing' });
  await databaseApi.insertUser({ firstName: 'A', lastName: 'Dmin', email: 'admin@test.io', password: 'Password123', roles: ['admin'] });
  await databaseApi.insertUser({ firstName: 'S', lastName: 'Ecretary', email: 'sec@test.io', password: 'Password123', roles: ['secretary'], campusIds: [campusA._id] });
  return { campusA, campusB, program, group, groupB };
};

export const api = (token) => ({
  get: (url) => request(app).get(`/api${url}`).set('Authorization', `Bearer ${token}`),
  post: (url, body) => request(app).post(`/api${url}`).set('Authorization', `Bearer ${token}`).send(body),
  put: (url, body) => request(app).put(`/api${url}`).set('Authorization', `Bearer ${token}`).send(body),
  delete: (url) => request(app).delete(`/api${url}`).set('Authorization', `Bearer ${token}`),
});
