// Read-only check of a database: what's set up and which one-off steps were run. Changes nothing.
//   node --env-file=.env src/scripts/checkDatabase.js
// Production: export MONGODB_URI='…atlas…' then: node src/scripts/checkDatabase.js
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const has = async (name) => (await db.listCollections({ name }).toArray()).length > 0;
const count = async (name) => ((await has(name)) ? db.collection(name).countDocuments() : 0);
const ok = (b) => (b ? '✔' : '✘');

console.log(`Database: ${db.databaseName}\n`);

// 1. syncIndexes.js: the unique indexes exist (certificates are the newest ones).
const indexes = (await has('certificates')) ? (await db.collection('certificates').indexes()).map((i) => Object.keys(i.key).join('+')) : [];
const studentIdx = (await has('students')) ? (await db.collection('students').indexes()).some((i) => i.key.studentNumber && i.unique) : false;
console.log(`${ok(studentIdx)} Indexes created (syncIndexes.js) for students`);
console.log(`${ok(indexes.includes('number') && indexes.includes('code'))} Indexes created for certificates${indexes.length ? '' : ' — run syncIndexes.js again'}`);

// 2. Percent migration: settings no longer have "graded out of", pass mark is a percentage.
const settings = (await has('settings')) ? await db.collection('settings').findOne({ _id: 'school' }) : null;
const exams20 = (await has('exams')) ? await db.collection('exams').countDocuments({ maxScore: { $ne: 100 } }) : 0;
if (!settings) console.log('–  Percent scores: no settings saved yet (nothing to convert)');
else console.log(`${ok(settings.defaultMaxScore === undefined && exams20 === 0)} Percent scores (2026-11-percent-scores.js): pass mark ${settings.defaultPassScore}${settings.defaultMaxScore !== undefined ? ` out of ${settings.defaultMaxScore} — run the migration` : ' %'}${exams20 ? `, ${exams20} exam(s) still out of 20` : ''}`);

// 3. Basics and accounts.
const admins = (await has('users')) ? await db.collection('users').find({ roles: 'admin' }, { projection: { email: 1 } }).toArray() : [];
console.log(`${ok(admins.length)} Admin account(s): ${admins.map((a) => a.email).join(', ') || 'none — run createAdmin.js'}`);
const programs = (await has('programs')) ? await db.collection('programs').find({}, { projection: { name: 1, levels: 1 } }).toArray() : [];
const zeroFees = programs.filter((p) => p.levels?.some((l) => !l.fee)).length;
console.log(`${ok(await count('campuses'))} Basics (setupBasics.js): ${await count('campuses')} campuses, ${await count('languages')} languages, ${programs.length} programs${zeroFees ? ` (${zeroFees} with fees still at 0)` : ''}`);
console.log(`   Data: ${await count('students')} students, ${await count('groups')} groups, ${await count('invoices')} invoices, ${await count('certificates')} certificates`);

await mongoose.disconnect();
