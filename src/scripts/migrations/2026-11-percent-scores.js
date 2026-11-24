// One-off migration (Nov 2026): exam scores become percentages (out of 100).
// Exams graded out of something else (20 by default before) are scaled: scores, pass mark and final scores.
// The school setting "default pass mark" is scaled the same way and "exams graded out of" is removed.
// Safe to run twice. Dry run by default:
//   node --env-file=.env src/scripts/migrations/2026-11-percent-scores.js          (preview)
//   APPLY=1 node --env-file=.env src/scripts/migrations/2026-11-percent-scores.js  (apply)
// Production: export MONGODB_URI='…atlas…' then run the same commands without --env-file.
import mongoose from 'mongoose';

const apply = process.env.APPLY === '1';
await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
console.log(`Database: ${db.databaseName} (${apply ? 'APPLY' : 'dry run'})`);
const pct = (v, max) => (typeof v === 'number' ? Math.round((v * 100 * 100) / max) / 100 : v);

const settings = await db.collection('settings').findOne({ _id: 'school' });
if (settings && settings.defaultMaxScore !== undefined) {
  const pass = pct(settings.defaultPassScore ?? settings.defaultMaxScore / 2, settings.defaultMaxScore || 20);
  console.log(`  settings: pass mark ${settings.defaultPassScore}/${settings.defaultMaxScore} -> ${pass} %`);
  if (apply) await db.collection('settings').updateOne({ _id: 'school' }, { $set: { defaultPassScore: pass }, $unset: { defaultMaxScore: '' } });
} else console.log('  settings: already in percent');

let exams = 0;
for (const e of await db.collection('exams').find({ maxScore: { $ne: 100 } }).toArray()) {
  const max = e.maxScore || 20;
  const results = (e.results ?? []).map((r) => ({ ...r, score: pct(r.score, max) }));
  exams++;
  if (!apply) continue;
  await db.collection('exams').updateOne({ _id: e._id }, { $set: { maxScore: 100, passScore: pct(e.passScore, max), results } });
  if (e.type === 'final') {
    for (const r of e.results ?? []) {
      if (typeof r.score !== 'number') continue;
      await db.collection('enrollments').updateMany({ group: e.group, student: r.student }, { $set: { finalScore: pct(r.score, max) } });
    }
  }
}
console.log(`  ${exams} exam(s) ${apply ? 'converted' : 'to convert'} to percent`);
await mongoose.disconnect();
