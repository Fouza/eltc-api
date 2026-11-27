// Students get a second phone number (phone2). One-off, safe to run again:
//  1. "0550…/0661…" typed in the phone box → first number stays, the second goes to phone2.
//  2. Spreadsheet import (tag archive-2026): the second number had been put in the guardian phone (no guardian name) → phone2.
//  3. EXTRA=/path/phone-extras.json: numbers the import left out ([{ lastName, firstName, match, phone, phone2, note }]).
//   node --env-file=.env src/scripts/migrations/2026-11-second-phone.js            (preview)
//   APPLY=1 node --env-file=.env src/scripts/migrations/2026-11-second-phone.js    (write)
import fs from 'node:fs';
import mongoose from 'mongoose';
import { initializeDb, disconnectDb } from '../../models/connection/index.js';
import { studentsCollection } from '../../models/index.js';

const apply = process.env.APPLY === '1';
await initializeDb();
console.log(`Database: ${mongoose.connection.name} (${apply ? 'APPLY' : 'preview — nothing written'})`);
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const key = (a, b) => `${fold(a)} ${fold(b)}`.match(/[a-z]+/g)?.sort().join(' ') ?? '';
const students = await studentsCollection.find({}, { firstName: 1, lastName: 1, phone: 1, phone2: 1, guardian: 1, tags: 1, notes: 1 }).lean();
const changes = new Map(); // id -> { set, unset }
const change = (s) => { if (!changes.has(String(s._id))) changes.set(String(s._id), { s, set: {}, unset: {} }); return changes.get(String(s._id)); };
const counts = { split: 0, guardian: 0, extra: 0, notFound: [] };

for (const s of students) {
  const parts = String(s.phone ?? '').split(/\s*[/,;]\s*|\s+-\s+/).filter(Boolean);
  if (parts.length > 1) {
    const c = change(s);
    c.set.phone = parts[0];
    if (!s.phone2) c.set.phone2 = parts.slice(1).join(' / ');
    counts.split += 1;
  }
  if (s.tags?.includes('archive-2026') && s.guardian?.phone && !s.guardian?.name) {
    const c = change(s);
    if (!s.phone2 && !c.set.phone2) c.set.phone2 = s.guardian.phone;
    c.unset['guardian.phone'] = 1;
    counts.guardian += 1;
  }
}

if (process.env.EXTRA) {
  for (const x of JSON.parse(fs.readFileSync(process.env.EXTRA, 'utf8'))) {
    const s = students.find((st) => st.tags?.includes('archive-2026') && key(st.lastName, st.firstName) === key(x.lastName, x.firstName) && (x.match ? st.phone === x.match : !st.phone));
    if (!s) { counts.notFound.push(`${x.lastName} ${x.firstName}`); continue; }
    const c = change(s);
    if (x.phone && !s.phone) c.set.phone = x.phone;
    if (x.phone2) c.set.phone2 = x.phone2;
    if (x.phone2 && s.guardian?.phone === x.phone2) c.unset['guardian.phone'] = 1;
    if (x.note && !String(s.notes ?? '').includes(x.note)) c.set.notes = [s.notes, x.note].filter(Boolean).join('. ');
    counts.extra += 1;
    console.log(`  ${x.lastName} ${x.firstName}: ${JSON.stringify(c.set)}`);
  }
}

console.log(`\n${counts.split} "a/b" phones split, ${counts.guardian} second numbers moved from the guardian phone, ${counts.extra} numbers restored from the spreadsheets`);
if (counts.notFound.length) console.log(`Not found: ${counts.notFound.join(', ')}`);
if (apply && changes.size) {
  const ops = [...changes.values()].map(({ s, set, unset }) => ({ updateOne: { filter: { _id: s._id }, update: { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) } } }));
  const res = await studentsCollection.bulkWrite(ops, { ordered: false });
  console.log(`written: ${res.modifiedCount} students`);
}
await disconnectDb();
