// Demo data for the prototype: npm run seed  (WIPES the database in MONGODB_URI first — never run on production)
import dayjs from 'dayjs';
import mongoose from 'mongoose';
import config from '../config.js';
import { initializeDb, disconnectDb } from '../models/connection/index.js';
import * as m from '../models/index.js';
import * as databaseApi from '../services/databaseApi/index.js';
import { runners } from '../scheduler/jobs/index.js';
import { toDay } from '../helpers/dates.js';

if (config.env === 'production' || /prod/i.test(config.mongoUri ?? '')) throw new Error('Refusing to seed a production database');

// Small deterministic PRNG so every seed gives the same demo.
let s = 42;
const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const pickOne = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;

await initializeDb();
await mongoose.connection.dropDatabase();
await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
console.log('Database reset:', mongoose.connection.name);

await databaseApi.updateSettings({ schoolName: 'ELTC School', currency: 'DZD', lowAttendanceThreshold: 3 });

// ---------- staff
const admin = await databaseApi.insertUser({
  firstName: 'School', lastName: 'Manager', email: config.admin.email ?? 'admin@eltc.school', password: config.admin.password ?? 'Admin123!', roles: ['admin'],
});
const staffPassword = 'Staff123!';
const secretary = await databaseApi.insertUser({ firstName: 'Amina', lastName: 'Benali', email: 'secretary@eltc.school', password: staffPassword, roles: ['secretary'] });
await databaseApi.insertUser({ firstName: 'Karim', lastName: 'Haddad', email: 'accountant@eltc.school', password: staffPassword, roles: ['accountant'] });
await databaseApi.insertUser({ firstName: 'Sophie', lastName: 'Martin', email: 'coordinator@eltc.school', password: staffPassword, roles: ['coordinator'] });

// ---------- campuses
const room = (n) => Array.from({ length: n }, (_, i) => ({ name: `Room ${i + 1}`, capacity: 14 }));
const campuses = await m.campusesCollection.insertMany([
  { name: 'Reghaia', code: 'RGH', city: 'Reghaia', address: 'Centre-ville', phone: '+213 23 00 00 01', color: '#064CA5', status: 'active', rooms: room(6) },
  { name: 'Rouiba', code: 'RBA', city: 'Rouiba', address: 'Centre-ville', phone: '+213 23 00 00 02', color: '#7B3FE4', status: 'active', rooms: room(4) },
  { name: 'Tizi Ouzou', code: 'TZO', city: 'Tizi Ouzou', address: 'Centre-ville', phone: '+213 26 00 00 03', color: '#0EA5A4', status: 'opening', openingDate: dayjs().add(2, 'month').startOf('month').toDate(), rooms: room(4) },
]);
const [rgh, rba] = campuses;
secretary && (await databaseApi.updateUser(secretary._id, { campusIds: [rgh._id] }));

// ---------- languages & programs (6 levels each)
const [fr, en, es] = await m.languagesCollection.insertMany([
  { name: 'French', code: 'fr', color: '#064CA5' },
  { name: 'English', code: 'en', color: '#7B3FE4' },
  { name: 'Spanish', code: 'es', color: '#F59E0B' },
]);
const LEVEL_NAMES = ['Beginner', 'Elementary', 'Pre-intermediate', 'Intermediate', 'Upper-intermediate', 'Advanced'];
const levels = (fee, weeks = 12) => LEVEL_NAMES.map((name, i) => ({ number: i + 1, name: `Level ${i + 1} – ${name}`, durationWeeks: weeks, hours: weeks * 3, fee: fee + i * 1000 }));
const programs = await m.programsCollection.insertMany([
  { name: 'French – Adults', language: fr._id, audience: 'adults', minAge: 16, levels: levels(18000), color: '#064CA5' },
  { name: 'French – Children', language: fr._id, audience: 'children', minAge: 6, maxAge: 12, levels: levels(14000, 10), color: '#3B82F6' },
  { name: 'English – Adults', language: en._id, audience: 'adults', minAge: 16, levels: levels(20000), color: '#7B3FE4' },
  { name: 'English – Children', language: en._id, audience: 'children', minAge: 6, maxAge: 12, levels: levels(15000, 10), color: '#A855F7' },
  { name: 'English – Teens', language: en._id, audience: 'teens', minAge: 13, maxAge: 17, levels: levels(17000), color: '#EC4899' },
  { name: 'Spanish – Adults', language: es._id, audience: 'adults', minAge: 16, levels: levels(18000), color: '#F59E0B' },
]);
const [frA, frC, enA, enC, enT, esA] = programs;

// ---------- teachers
const teacherData = [
  ['Claire', 'Dubois', [fr], [rgh, rba]], ['Yacine', 'Mansouri', [fr], [rgh]], ['Emily', 'Carter', [en], [rgh, rba]],
  ['Samir', 'Bouzid', [en], [rba]], ['Nadia', 'Rahmani', [fr, en], [rgh]], ['James', 'Wilson', [en], [rgh]],
  ['Lucia', 'Fernandez', [es, fr], [rgh, rba]], ['Leila', 'Kaci', [fr], [rba]],
];
const teachers = await m.teachersCollection.insertMany(
  teacherData.map(([firstName, lastName, langs, cs], i) => ({
    firstName, lastName, phone: `+213 55 ${String(100000 + i * 7341).slice(0, 6)}`, email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@eltc.school`,
    languages: langs.map((l) => l._id), campusIds: cs.map((c) => c._id), hourlyRate: 1500,
  })),
);
const T = Object.fromEntries(teachers.map((t) => [t.firstName, t]));

// ---------- groups
const weeksAgo = (w) => toDay(dayjs().subtract(w, 'week'));
const slots = (days, start, end) => days.map((day) => ({ day, startTime: start, endTime: end }));
const g = (name, program, levelNumber, campus, teacher, schedule, startW, weeks, status, capacity = 12) => ({
  name, program: program._id, levelNumber, campus: campus._id, teacher: teacher._id, schedule, capacity, room: `Room ${1 + Math.floor(rnd() * 4)}`,
  startDate: weeksAgo(startW), endDate: toDay(dayjs(weeksAgo(startW)).add(weeks, 'week')), status,
});
const groupDocs = await m.groupsCollection.insertMany([
  g('FR-A1 Evening', frA, 1, rgh, T.Claire, slots([0, 2], '18:00', '19:30'), 6, 12, 'ongoing'),
  g('FR-A3 Morning', frA, 3, rgh, T.Yacine, slots([1, 3], '09:30', '11:00'), 5, 12, 'ongoing', 10),
  g('FR-A2 Weekend', frA, 2, rba, T.Leila, slots([5, 6], '10:00', '12:00'), 7, 12, 'ongoing'),
  g('FR-C1 Saturday', frC, 1, rgh, T.Nadia, slots([6], '09:00', '11:00'), 4, 10, 'ongoing', 10),
  g('FR-C2 Wednesday', frC, 2, rba, T.Claire, slots([3], '14:00', '16:00'), 4, 10, 'ongoing', 10),
  g('EN-A2 Evening', enA, 2, rgh, T.Emily, slots([0, 2], '18:00', '19:30'), 6, 12, 'ongoing'),
  g('EN-A4 Evening', enA, 4, rba, T.Samir, slots([1, 3], '18:30', '20:00'), 8, 12, 'ongoing'),
  g('EN-C1 Saturday', enC, 1, rgh, T.James, slots([6], '14:00', '16:00'), 3, 10, 'ongoing', 10),
  g('EN-T3 Afternoon', enT, 3, rgh, T.Nadia, slots([2, 4], '16:30', '18:00'), 5, 12, 'ongoing'),
  g('ES-A1 Evening', esA, 1, rba, T.Lucia, slots([1, 3], '18:00', '19:30'), 2, 12, 'ongoing', 12),
  g('EN-A1 Evening (prev.)', enA, 1, rgh, T.Emily, slots([0, 2], '18:00', '19:30'), 20, 12, 'completed'),
  g('FR-A2 Evening (next)', frA, 2, rgh, T.Claire, slots([0, 2], '18:00', '19:30'), -6, 12, 'planned'),
  g('EN-A2 Morning (new)', enA, 2, rba, T.Samir, slots([0, 2], '09:30', '11:00'), -2, 12, 'planned'),
]);
const groups = await m.groupsCollection.find({ _id: { $in: groupDocs.map((x) => x._id) } }).populate('program').lean();

// ---------- students
const FIRST_F = ['Sarah', 'Lina', 'Yasmine', 'Ines', 'Meriem', 'Amel', 'Chloé', 'Nour', 'Rania', 'Imene', 'Lea', 'Kenza', 'Salma', 'Maya', 'Hiba', 'Aya'];
const FIRST_M = ['Adam', 'Rayan', 'Yanis', 'Mehdi', 'Amine', 'Ilyes', 'Lucas', 'Anis', 'Walid', 'Sofiane', 'Hugo', 'Nassim', 'Riad', 'Omar', 'Malik', 'Idir'];
const LAST = ['Benali', 'Bouzid', 'Haddad', 'Mansouri', 'Cherif', 'Kaci', 'Belkacem', 'Saidi', 'Ziani', 'Brahimi', 'Meziane', 'Lounis', 'Amrani', 'Hamidi', 'Boudiaf', 'Toumi', 'Ferhat', 'Djebbar', 'Laribi', 'Moreau'];
const SOURCES = ['Facebook', 'Instagram', 'Friend', 'Walk-in', 'Google', 'Former student'];
const makeStudent = (campus, audience, registeredAt, status = 'active') => {
  const gender = chance(0.55) ? 'female' : 'male';
  const firstName = pickOne(gender === 'female' ? FIRST_F : FIRST_M);
  const lastName = pickOne(LAST);
  const age = audience === 'children' ? 6 + Math.floor(rnd() * 7) : audience === 'teens' ? 13 + Math.floor(rnd() * 5) : 18 + Math.floor(rnd() * 35);
  const phone = `+213 ${pickOne(['55', '66', '77'])} ${String(Math.floor(rnd() * 1e6)).padStart(6, '0')}`;
  return {
    firstName, lastName, gender, campus, status, registeredAt,
    birthDate: dayjs().subtract(age, 'year').subtract(Math.floor(rnd() * 300), 'day').toDate(),
    phone: audience === 'adults' ? phone : undefined,
    email: audience === 'adults' && chance(0.7) ? `${firstName}.${lastName}${Math.floor(rnd() * 99)}@mail.com`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') : undefined,
    occupation: audience === 'adults' ? pickOne(['Student', 'Engineer', 'Doctor', 'Teacher', 'Accountant', 'Pharmacist', 'Sales']) : 'Pupil',
    guardian: audience !== 'adults' ? { name: `${pickOne(FIRST_M)} ${lastName}`, relation: pickOne(['Father', 'Mother']), phone } : undefined,
    city: pickOne(['Reghaia', 'Rouiba', 'Heraoua', 'Ain Taya', 'Bordj El Bahri']),
    source: pickOne(SOURCES),
  };
};

let created = 0;
const enrolledByGroup = {};
const completedIds = groups.filter((x) => x.status === 'completed').map((x) => x._id);
await m.groupsCollection.updateMany({ _id: { $in: completedIds } }, { $set: { status: 'ongoing' } }); // reopened while we fill it
for (const group of groups.filter((x) => x.status !== 'planned')) {
  const size = Math.min(group.capacity, 6 + Math.floor(rnd() * (group.capacity - 4)));
  for (let i = 0; i < size; i++) {
    const registeredAt = dayjs(group.startDate).subtract(Math.floor(rnd() * 20), 'day').toDate();
    const student = await databaseApi.insertStudent(makeStudent(group.campus, group.program.audience, registeredAt), admin._id);
    created++;
    const installments = pickOne([1, 1, 2, 3]);
    const discount = chance(0.15) ? 2000 : 0;
    const { enrollment, invoices } = await databaseApi.enrollStudent(
      { studentId: student._id, groupId: group._id, installments, discount, discountReason: discount ? 'Sibling discount' : undefined, firstDueDate: group.startDate, force: true },
      admin._id,
    );
    await m.enrollmentsCollection.updateOne({ _id: enrollment._id }, { $set: { enrolledAt: registeredAt } });
    (enrolledByGroup[group._id] ??= []).push({ student, enrollment });

    // Payments: most pay on time, some are late, a few never paid.
    const profile = rnd();
    for (const inv of invoices) {
      if (inv.dueDate > new Date()) {
        if (chance(0.15)) await databaseApi.insertPayment({ invoiceId: inv._id, amount: inv.amount, method: 'cash', paidAt: new Date() }, admin._id);
        continue;
      }
      const paidAt = dayjs(inv.dueDate).add(Math.floor(rnd() * 6), 'day').toDate();
      const method = pickOne(['cash', 'cash', 'cash', 'card', 'transfer', 'cheque']);
      if (profile < 0.72) await databaseApi.insertPayment({ invoiceId: inv._id, amount: inv.amount, method, paidAt: paidAt > new Date() ? new Date() : paidAt }, admin._id);
      else if (profile < 0.86) await databaseApi.insertPayment({ invoiceId: inv._id, amount: Math.round(inv.amount / 2), method, paidAt: paidAt > new Date() ? new Date() : paidAt }, admin._id);
      // else: overdue, nothing paid
    }
    if (group.status === 'completed') {
      await m.enrollmentsCollection.updateOne({ _id: enrollment._id }, { $set: { status: 'completed', endedAt: group.endDate } });
    }
  }
}

await m.groupsCollection.updateMany({ _id: { $in: completedIds } }, { $set: { status: 'completed' } });

// A few students left their group.
for (const group of groups.filter((x) => x.status === 'ongoing').slice(0, 3)) {
  const e = enrolledByGroup[group._id].at(-1);
  await databaseApi.updateEnrollment(e.enrollment._id, { status: 'dropped', cancelUnpaidInvoices: true });
}

// ---------- waiting list (prospects)
const wishes = [[frA, 1, rgh], [frA, 1, rgh], [frA, 2, rgh], [enA, 1, rba], [enA, 1, rba], [enA, 1, rba], [enC, 2, rgh], [esA, 2, rba], [frC, 1, rba], [enA, 3, rgh], [enT, 1, rgh], [enA, 1, rba]];
for (const [program, level, campus] of wishes) {
  await databaseApi.insertStudent(
    { ...makeStudent(campus._id, program.audience, dayjs().subtract(Math.floor(rnd() * 25), 'day').toDate(), 'prospect'), desiredProgram: program._id, desiredLevel: level, preferredSlots: pickOne(['Weekday evenings', 'Saturday morning', 'Mornings', 'Any']) },
    secretary._id,
  );
  created++;
}

// ---------- attendance: every past session of ongoing groups
const habitualAbsentees = new Set();
for (const group of groups.filter((x) => x.status === 'ongoing')) {
  const roster = enrolledByGroup[group._id] ?? [];
  roster.slice(0, 1).forEach((r) => habitualAbsentees.add(String(r.student._id)));
  for (let d = dayjs(group.startDate); d.isBefore(dayjs(), 'day'); d = d.add(1, 'day')) {
    if (!group.schedule.some((sl) => sl.day === d.day())) continue;
    const recent = dayjs().diff(d, 'day') <= 30;
    await m.attendancesCollection.create({
      group: group._id, campus: group.campus, teacher: group.teacher, date: toDay(d), recordedBy: secretary._id,
      topic: pickOne(['Introductions', 'Grammar: present tense', 'Listening practice', 'Vocabulary: daily life', 'Oral expression', 'Reading comprehension', 'Review']),
      entries: roster.map(({ student }) => {
        const absentee = habitualAbsentees.has(String(student._id)) && recent;
        const r = rnd();
        return { student: student._id, status: absentee ? (r < 0.6 ? 'absent' : 'present') : r < 0.06 ? 'absent' : r < 0.11 ? 'late' : r < 0.13 ? 'excused' : 'present' };
      }),
    });
  }
}

// ---------- exams
for (const group of groups.filter((x) => x.status !== 'planned')) {
  const roster = enrolledByGroup[group._id] ?? [];
  const results = () => roster.map(({ student }) => (chance(0.05) ? { student: student._id, absent: true } : { student: student._id, score: Math.round((7 + rnd() * 13) * 2) / 2 }));
  const quiz = await databaseApi.insertExam({ group: group._id, title: 'Quiz 1', type: 'quiz', date: dayjs(group.startDate).add(3, 'week').toDate() }, admin._id);
  if (quiz.date < new Date()) await databaseApi.saveExamResults(quiz._id, results(), admin._id);
  if (group.status === 'completed') {
    const final = await databaseApi.insertExam({ group: group._id, title: 'Final exam', type: 'final', date: dayjs(group.endDate).subtract(3, 'day').toDate(), coefficient: 2 }, admin._id);
    await databaseApi.saveExamResults(final._id, results(), admin._id);
  } else {
    const mid = await databaseApi.insertExam({ group: group._id, title: 'Midterm', type: 'midterm', date: dayjs(group.startDate).add(6, 'week').toDate(), coefficient: 2 }, admin._id);
    if (mid.date < dayjs().subtract(2, 'day').toDate() && chance(0.6)) await databaseApi.saveExamResults(mid._id, results(), admin._id);
    await databaseApi.insertExam({ group: group._id, title: 'Final exam', type: 'final', date: dayjs(group.endDate).subtract(2, 'day').toDate(), coefficient: 2 }, admin._id);
  }
}

// ---------- notifications from the daily jobs
for (const [name, run] of Object.entries(runners)) console.log(name, await run());

console.log(`\nSeed done: ${created} students, ${groups.length} groups.`);
console.log(`Log in with ${config.admin.email ?? 'admin@eltc.school'} / ${config.admin.password ?? 'Admin123!'}`);
console.log(`Staff accounts: secretary@ / accountant@ / coordinator@eltc.school with ${staffPassword}`);
await disconnectDb();
