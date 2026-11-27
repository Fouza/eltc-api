// One-off import of the school's 2026 payment spreadsheets ("Archivage anglais 2026", "Archive francais 2026", evening course).
// The spreadsheets are read and cleaned beforehand into a plan file (groups, students, enrollments, payments — see the
// notes printed in the report); this script writes that plan into the database using the app's own rules
// (4-week blocks, receipts, books). Existing data is kept: teachers, groups and students already in the database are
// matched and reused, an enrollment that already exists is left as it is.
//   PLAN=/path/plan.json node --env-file=.env src/scripts/importArchive.js            (preview, writes nothing)
//   PLAN=/path/plan.json APPLY=1 node --env-file=.env src/scripts/importArchive.js    (import)
// REPORT=/path/report.md also writes the full report there. Refuses to run twice (students tagged archive-2026).
import fs from 'node:fs';
import mongoose from 'mongoose';
import { initializeDb, disconnectDb } from '../models/connection/index.js';
import * as m from '../models/index.js';
import * as databaseApi from '../services/databaseApi/index.js';
import { ADULT_SCHEDULES, sessionsLabel, sortSessions, scheduleFromSessions } from '../constants/sessions.js';
import { addDays, toDay } from '../helpers/dates.js';

const TAG = 'archive-2026';
const apply = process.env.APPLY === '1';
const plan = JSON.parse(fs.readFileSync(process.env.PLAN, 'utf8'));
const today = toDay(new Date());
const out = [];
const say = (...a) => { const line = a.join(' '); out.push(line); console.log(line); };

// Spreadsheet level → program and level number of the app.
const LEVELS = {
  'English – Children': { 'Bounce 1': 1, 'Bounce 2': 2, 'Bounce 3': 3, 'Bounce 4': 4, 'Bounce 5': 5, 'Bounce 6': 6 },
  'English – Adults': { A1: 1, A2: 2, B1: 3, 'B1+': 4, B2: 5, C1: 6 },
  'French – Children': { Taoki1: 1, TipTip1: 2, TipTop2: 3, TipTop3: 4, Adosphere1: 5, Adosphere2: 6, Adosphere3: 7, Adosphere4: 8 },
};
const placeOf = (g) => (g.level.startsWith('Totem') ? ['French – Adults', Number(g.level.split(' ')[1])] : [g.program, LEVELS[g.program][g.level]]);

// Corrections to the programs (shown in the preview). Course fees come out of the spreadsheets: 6 000 DZD per 4 weeks for
// adults, 3 000 for children; books are charged on their own.
const PROGRAM_FIXES = {
  'English – Adults': { fees: { 1: 12000, 2: 18000, 3: 18000, 4: 24000, 5: 24000, 6: 24000 } },
  'French – Children': { names: { 2: 'TipTop1' } }, // typo "TipTip1"
  'French – Adults': { names: { 1: 'A1 (Totem 1)', 2: 'A2 (Totem 2)', 3: 'B1 (Totem 3)' }, weeks: { 1: 8 } },
};
const BOOK_TITLES = {
  'English – Children': (n) => `Bounce ${n}`,
  'English – Adults': (n) => ['Beginner A1', 'Elementary A2', 'Pre-Intermediate B1', 'Intermediate B1+', 'Upper-Intermediate B2', 'Advanced C1'][n - 1],
  'French – Children': (n) => ['Taoki 1', 'Tip Top 1', 'Tip Top 2', 'Tip Top 3', 'Adosphère 1', 'Adosphère 2', 'Adosphère 3', 'Adosphère 4'][n - 1],
  'French – Adults': (n) => `Totem ${n}`,
};
const TEACHER_ALIASES = { cyrine: 'cerine', ibtissem: 'ibtissam', ilhem: 'ilham', 'imane bel': 'imane', 'serine': 'serine' };
const SCHEDULE_SESSIONS = Object.fromEntries(ADULT_SCHEDULES.map((s) => [s.key, s.sessions]));
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const nameKey = (a, b) => `${fold(a)} ${fold(b)}`.match(/[a-z]+/g)?.sort().join(' ') ?? '';
const money = (n) => `${Math.round(n).toLocaleString('fr-FR')} DZD`;
const mode = (xs) => [...xs.reduce((c, x) => c.set(x, (c.get(x) ?? 0) + 1), new Map())].sort((a, b) => b[1] - a[1])[0]?.[0];

await initializeDb();
say(`# Spreadsheet import — ${mongoose.connection.name} (${apply ? 'IMPORT' : 'preview, nothing written'})\n`);
if (await m.studentsCollection.exists({ tags: TAG })) {
  say('Already imported (students tagged archive-2026 exist). Stopping.');
  await disconnectDb();
  process.exit(1);
}
const admin = await m.usersCollection.findOne({ roles: 'admin' }).lean();
const campus = await m.campusesCollection.findOne({ name: 'Reghaia' }).lean();
if (!campus) throw new Error('Campus Reghaia not found');
const programs = Object.fromEntries((await m.programsCollection.find().lean()).map((p) => [p.name, p]));
const languages = await m.languagesCollection.find().lean();
const langId = (code) => languages.find((l) => l.code === code)._id;

// ---- 1. program fixes ----
say('## Programs');
for (const [name, fix] of Object.entries(PROGRAM_FIXES)) {
  const p = programs[name];
  const levels = p.levels.map((l) => ({ ...l }));
  for (const l of levels) {
    const changes = [];
    if (fix.fees?.[l.number] != null && fix.fees[l.number] !== l.fee) { changes.push(`fee ${l.fee} → ${fix.fees[l.number]}`); l.fee = fix.fees[l.number]; }
    if (fix.weeks?.[l.number] != null && fix.weeks[l.number] !== l.durationWeeks) { changes.push(`${l.durationWeeks} weeks → ${fix.weeks[l.number]}`); l.durationWeeks = fix.weeks[l.number]; }
    if (fix.names?.[l.number] && fix.names[l.number] !== l.name) { changes.push(`name "${l.name}" → "${fix.names[l.number]}"`); l.name = fix.names[l.number]; }
    if (changes.length) say(`- ${name} · level ${l.number}: ${changes.join(', ')}`);
  }
  if (apply) await m.programsCollection.updateOne({ _id: p._id }, { $set: { levels } });
  p.levels = levels;
}

// ---- 2. books: one per level used, at the price most students paid ----
say('\n## Books');
const books = await m.booksCollection.find().lean();
const groupsPlan = plan.groups.map((g) => {
  const [programName, levelNumber] = placeOf(g);
  return { ...g, programName, levelNumber, program: programs[programName] };
});
const neededBooks = new Map();
for (const e of plan.enrollments) {
  const g = groupsPlan[e.gi];
  const k = `${g.programName}|${g.levelNumber}`;
  if (!neededBooks.has(k)) neededBooks.set(k, []);
  if (e.book.mode === 'paid' && e.book.amount) neededBooks.get(k).push(e.book.amount);
}
for (const [k, prices] of neededBooks) {
  const [programName, n] = k.split('|');
  const p = programs[programName];
  if (books.some((b) => b.levels.some((l) => String(l.program) === String(p._id) && l.levelNumber === Number(n)))) continue;
  const price = mode(prices) ?? 0;
  const title = BOOK_TITLES[programName](Number(n));
  say(`- new book "${title}" ${money(price)} (${programName}, level ${n})`);
  if (apply) books.push((await m.booksCollection.create({ title, price, levels: [{ program: p._id, levelNumber: Number(n) }], stock: [{ campus: campus._id, quantity: 0 }] })).toObject());
}

// ---- 3. teachers ----
say('\n## Teachers');
const teachers = await m.teachersCollection.find().lean();
const teacherFor = new Map();
for (const g of groupsPlan) {
  const lang = g.programName.startsWith('French') ? 'fr' : 'en';
  const first = TEACHER_ALIASES[fold(g.teacher)] ?? fold(g.teacher).split(' ')[0];
  const key = `${first}|${lang}`;
  if (teacherFor.has(key)) { g.teacherKey = key; continue; }
  let t = teachers.find((x) => fold(x.firstName) === first && x.languages?.some((l) => String(l) === String(langId(lang))));
  if (!t) {
    const firstName = first[0].toUpperCase() + first.slice(1);
    say(`- new teacher ${firstName} ${lang === 'fr' ? 'Fr' : 'Eng'}`);
    t = apply ? (await m.teachersCollection.create({ firstName, lastName: lang === 'fr' ? 'Fr' : 'Eng', languages: [langId(lang)], campusIds: [campus._id] })).toObject() : { _id: null, firstName, lastName: '(new)' };
  }
  teacherFor.set(key, t);
  g.teacherKey = key;
}
for (const g of groupsPlan) g.teacherDoc = teacherFor.get(g.teacherKey);

// ---- 4. groups: reuse a group already in the database (same level, sessions and teacher) ----
say('\n## Groups');
const existingGroups = await m.groupsCollection.find().lean();
for (const g of groupsPlan) {
  const level = g.program.levels.find((l) => l.number === g.levelNumber);
  g.sessions = sortSessions(SCHEDULE_SESSIONS[g.schedule] ?? [g.schedule]);
  const start = new Date(`${g.start}T00:00:00.000Z`);
  const end = addDays(start, 7 * (level.durationWeeks ?? 12));
  const match = existingGroups.find((x) => String(x.program) === String(g.program._id) && x.levelNumber === g.levelNumber && sortSessions(x.sessions).join() === g.sessions.join() && g.teacherDoc._id && String(x.teacher) === String(g.teacherDoc._id));
  const active = plan.enrollments.filter((e) => e.gi === g.gi && e.status === 'active').length;
  if (match) {
    const set = { capacity: Math.max(match.capacity ?? 12, active + 2) };
    const moved = toDay(match.startDate)?.getTime() !== start.getTime();
    // The spreadsheet start is kept unless the existing group starts later and the sheet's own date was corrected.
    if (moved) Object.assign(set, { startDate: start, endDate: end, status: start <= today ? 'ongoing' : match.status });
    say(`- reuse "${match.name}" for ${g.level} · ${g.teacher} (${g.ref})${moved ? `: start ${match.startDate?.toISOString().slice(0, 10)} → ${g.start}` : ''}`);
    if (apply) await m.groupsCollection.updateOne({ _id: match._id }, { $set: set });
    g.groupId = match._id;
    continue;
  }
  const lang = g.programName.startsWith('French') ? 'FR' : 'EN';
  const name = `${lang} - ${level.name} ${g.program.audience === 'children' ? 'Kids' : 'Adults'} ${sessionsLabel(g.sessions)} · ${g.teacherDoc.firstName}`;
  g.name = name;
  if (apply) {
    const created = await m.groupsCollection.create({
      name, program: g.program._id, levelNumber: g.levelNumber, campus: campus._id, teacher: g.teacherDoc._id,
      sessions: g.sessions, schedule: scheduleFromSessions(g.sessions), startDate: start, endDate: end,
      capacity: Math.max(12, active + 2), status: start <= today ? 'ongoing' : 'planned', // closed at the end when already over
      notes: `Imported from the spreadsheet (${g.ref})`,
    });
    g.groupId = created._id;
    if (end < today) g.closeAfter = true;
  }
}
const newGroups = groupsPlan.filter((g) => g.name);
say(`- ${newGroups.length} new groups, e.g. ${newGroups.slice(0, 3).map((g) => `"${g.name}"`).join(', ')}`);

// ---- 5. students: reuse a student already in the database (same name, phones that don't contradict) ----
say('\n## Students');
const existingStudents = await m.studentsCollection.find({}, { firstName: 1, lastName: 1, phone: 1, guardian: 1 }).lean();
const studentId = new Map();
let created = 0;
for (const s of plan.students) {
  const key = nameKey(s.lastName, s.firstName);
  const phones = (p) => String(p ?? '').split(/[^\d]+/).filter((x) => x.length >= 9);
  const match = existingStudents.find((x) => nameKey(x.lastName, x.firstName) === key && (!s.phones.length || !x.phone || phones(x.phone).concat(phones(x.guardian?.phone)).some((p) => s.phones.includes(p))));
  if (match) { say(`- already in the database: ${match.firstName} ${match.lastName} — the spreadsheet groups are added to this student`); studentId.set(s.sid, match._id); continue; }
  created += 1;
  if (!apply) continue;
  const mine = plan.enrollments.filter((e) => e.sid === s.sid);
  const firstDate = mine.flatMap((e) => [e.joined, ...e.payments.map((p) => p.date)]).sort()[0];
  const notes = [...new Set(mine.flatMap((e) => e.notes))];
  const st = await databaseApi.insertStudent({
    firstName: s.firstName, lastName: s.lastName, phone: s.phones[0], ...(s.phones[1] ? { guardian: { phone: s.phones[1] } } : {}),
    campus: campus._id, status: 'active', registeredAt: new Date(`${firstDate}T00:00:00.000Z`),
    tags: [TAG, ...(mine.some((e) => e.rabie) ? ['mr-rabie'] : [])],
    notes: [`Imported from the spreadsheets (${mine.map((e) => e.ref).join('; ')})`, ...notes].join('. '),
  }, admin?._id);
  studentId.set(s.sid, st._id);
}
say(`- ${created} new students`);

// ---- 6. enrollments, statuses, then payments ----
const stats = { enrollments: 0, skipped: 0, payments: 0, paid: 0, notPlaced: [] };
if (apply) {
  const enrollmentOf = new Map();
  const byStudent = new Map();
  for (const e of plan.enrollments) byStudent.set(e.sid, [...(byStudent.get(e.sid) ?? []), e]);
  for (const [sid, list] of byStudent) {
    const sId = studentId.get(sid);
    list.sort((a, b) => a.joined.localeCompare(b.joined));
    for (const e of list) {
      const g = groupsPlan[e.gi];
      if (await m.enrollmentsCollection.exists({ student: sId, group: g.groupId })) {
        stats.skipped += 1;
        say(`- kept as it is: ${plan.students[sid].lastName} ${plan.students[sid].firstName} is already in "${g.name ?? 'the existing group'}" (the spreadsheet line is not imported again)`);
        continue;
      }
      // Students sent by Mr Rabie study for free (course and book).
      const free = e.rabie ? { discount: g.program.levels.find((l) => l.number === g.levelNumber)?.fee ?? 0, discountReason: 'Sent by Mr Rabie (free)' } : {};
      const charge = !e.rabie && ['paid', 'owed'].includes(e.book.mode) ? undefined : [];
      const { enrollment, invoices } = await databaseApi.enrollStudent({ studentId: sId, groupId: g.groupId, enrolledAt: new Date(`${e.joined}T00:00:00.000Z`), force: true, books: charge, ...free, notes: e.notes.join('. ') || undefined }, admin?._id);
      const bookInv = invoices.find((i) => i.kind === 'book');
      if (bookInv && e.book.mode === 'paid' && e.book.amount && e.book.amount !== bookInv.amount) await m.invoicesCollection.updateOne({ _id: bookInv._id }, { $set: { amount: e.book.amount } });
      enrollmentOf.set(e, { id: enrollment._id, bookInv });
      stats.enrollments += 1;
    }
    // Leaving a group: blocks after the student left are cancelled.
    for (const e of list) {
      const mine = enrollmentOf.get(e);
      if (!mine || e.status === 'active') continue;
      const g = groupsPlan[e.gi];
      const level = g.program.levels.find((l) => l.number === g.levelNumber);
      const joined = new Date(`${e.joined}T00:00:00.000Z`);
      const next = e.toGi != null ? list.find((x) => x.gi === e.toGi) : null;
      let endedAt;
      if (e.status === 'transferred') endedAt = new Date(`${next?.joined ?? e.joined}T00:00:00.000Z`);
      else if (e.status === 'completed') endedAt = addDays(new Date(`${g.start}T00:00:00.000Z`), 7 * level.durationWeeks);
      else endedAt = addDays(joined, 28 * e.payments.length);
      if (endedAt > today) endedAt = today;
      const set = { status: e.status, endedAt };
      if (next && enrollmentOf.get(next)) set.transferredTo = enrollmentOf.get(next).id;
      await m.enrollmentsCollection.updateOne({ _id: mine.id }, { $set: set });
      if (e.status !== 'completed') {
        await m.invoicesCollection.updateMany({ enrollment: mine.id, kind: 'course', status: 'unpaid', dueDate: { $gte: endedAt } }, { $set: { status: 'cancelled', notes: 'Cancelled: student left the group' } });
      }
    }
    // Payments, in date order: the book first (paid with the first payment), then each course payment.
    const pays = [];
    for (const e of list) {
      const mine = enrollmentOf.get(e);
      if (!mine) continue;
      if (mine.bookInv && e.book.mode === 'paid') pays.push({ e, mine, date: e.payments[0]?.date ?? e.joined, amount: e.book.amount ?? mine.bookInv.amount, book: true });
      for (const p of e.payments) pays.push({ e, mine, date: p.date, amount: p.amount });
    }
    pays.sort((a, b) => a.date.localeCompare(b.date) || (b.book ? 1 : 0) - (a.book ? 1 : 0));
    for (const p of pays) {
      const target = p.book
        ? await m.invoicesCollection.findById(p.mine.bookInv._id).lean()
        : (await m.invoicesCollection.findOne({ enrollment: p.mine.id, kind: 'course', status: { $in: ['unpaid', 'partial'] } }).sort({ dueDate: 1 }).lean())
          ?? (await m.invoicesCollection.findOne({ student: sId, status: { $in: ['unpaid', 'partial'] } }).sort({ dueDate: 1 }).lean());
      const owed = (await m.invoicesCollection.find({ student: sId, status: { $in: ['unpaid', 'partial'] } }).lean()).reduce((s, i) => s + i.amount - i.paidAmount, 0);
      const amount = Math.min(p.amount, Math.round(owed * 100) / 100);
      if (!target || amount <= 0) { stats.notPlaced.push(`${plan.students[sid].lastName} ${plan.students[sid].firstName}: ${money(p.amount)} on ${p.date} — nothing left to pay (${p.e.ref})`); continue; }
      if (amount < p.amount) stats.notPlaced.push(`${plan.students[sid].lastName} ${plan.students[sid].firstName}: ${money(p.amount - amount)} of ${money(p.amount)} on ${p.date} — more than everything owed (${p.e.ref})`);
      await databaseApi.insertPayment({ invoiceId: target._id, amount, method: 'cash', paidAt: new Date(`${p.date}T09:00:00.000Z`), notes: `From the spreadsheet (${p.e.ref})` }, admin?._id);
      if (p.book) await m.invoicesCollection.updateOne({ _id: p.mine.bookInv._id }, { $set: { handedOverAt: new Date(`${p.date}T09:00:00.000Z`) } });
      stats.payments += 1;
      stats.paid += amount;
    }
    await databaseApi.syncStudentStatus(sId);
  }
}

if (apply) {
  const over = groupsPlan.filter((g) => g.closeAfter);
  await m.groupsCollection.updateMany({ _id: { $in: over.map((g) => g.groupId) } }, { $set: { status: 'completed' } });
  if (over.length) say(`\n- ${over.length} group(s) already over, marked completed: ${over.map((g) => g.name).join(', ')}`);
}

// ---- 7. report ----
say('\n## Result');
if (!apply) say(`- would import ${plan.enrollments.length} enrollments and ${plan.enrollments.reduce((s, e) => s + e.payments.length, 0)} payments`);
else {
  const owed = await m.invoicesCollection.aggregate([{ $match: { status: { $in: ['unpaid', 'partial'] }, dueDate: { $lte: today } } }, { $group: { _id: null, n: { $sum: 1 }, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } }]);
  const overdue = await m.invoicesCollection.countDocuments({ status: { $in: ['unpaid', 'partial'] }, overdueAt: { $lt: today } });
  say(`- ${stats.enrollments} enrollments, ${stats.skipped} already there; ${stats.payments} payment lines, ${money(stats.paid)} recorded`);
  say(`- due today and not paid: ${owed[0]?.n ?? 0} invoices, ${money(owed[0]?.total ?? 0)}; overdue: ${overdue}`);
  say(`- in the database now: ${await m.studentsCollection.countDocuments()} students, ${await m.groupsCollection.countDocuments()} groups, ${await m.invoicesCollection.countDocuments()} invoices, ${await m.paymentsCollection.countDocuments()} payments`);
  if (stats.notPlaced.length) { say(`\n## Money not placed (${stats.notPlaced.length})`); stats.notPlaced.forEach((x) => say(`- ${x}`)); }
}
say('\n## Corrections made while reading the spreadsheets');
for (const [k, v] of Object.entries(plan.issues)) { say(`\n### ${k} (${v.length})`); v.forEach((x) => say(`- ${x}`)); }
if (process.env.REPORT) fs.writeFileSync(process.env.REPORT, out.join('\n'));
await disconnectDb();
