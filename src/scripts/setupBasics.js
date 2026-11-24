// Fills an empty (or partly filled) database with the school's basics: settings, campuses, languages, programs & levels.
// Never deletes or overwrites anything: what already exists (same campus code, language code or program name) is skipped.
// Dry run by default:
//   node --env-file=.env src/scripts/setupBasics.js            (preview)
//   APPLY=1 node --env-file=.env src/scripts/setupBasics.js    (write)
// Production: export MONGODB_URI='…atlas…' then run the same commands without --env-file.
// Edit the lists below first (fees, rooms, phone numbers…); everything can also be changed later in the app.
import mongoose from 'mongoose';
import { initializeDb, disconnectDb } from '../models/connection/index.js';
import * as m from '../models/index.js';
import * as databaseApi from '../services/databaseApi/index.js';
import { defaultLevelNames } from '../constants/enums.js';

const SETTINGS = { schoolName: 'ELTC School', currency: 'DZD', lowAttendanceThreshold: 3 };

const rooms = (n, capacity = 14) => Array.from({ length: n }, (_, i) => ({ name: `Room ${i + 1}`, capacity }));
const CAMPUSES = [
  { name: 'Reghaia', code: 'RGH', city: 'Reghaia', color: '#064CA5', status: 'active', rooms: rooms(6) },
  { name: 'Rouiba', code: 'RBA', city: 'Rouiba', color: '#7B3FE4', status: 'active', rooms: rooms(4) },
  { name: 'Tizi Ouzou', code: 'TZO', city: 'Tizi Ouzou', color: '#0EA5A4', status: 'opening', rooms: rooms(4) },
];

const LANGUAGES = [
  { name: 'French', code: 'fr', color: '#064CA5' },
  { name: 'English', code: 'en', color: '#7B3FE4' },
  { name: 'Spanish', code: 'es', color: '#F59E0B' },
];

// fees: one per level (adults A1 A2 B1 B1+ B2 C1 · children Bounce 1 → 6). Left at 0 until the school gives its prices:
// set them in the app (Programs & levels) before enrolling anyone — a level at 0 creates no invoice.
const PROGRAMS = [
  { name: 'French – Adults', language: 'fr', audience: 'adults', minAge: 16, weeks: 12, fees: [], color: '#064CA5' },
  { name: 'French – Children', language: 'fr', audience: 'children', minAge: 6, maxAge: 15, weeks: 10, fees: [], color: '#3B82F6' },
  { name: 'English – Adults', language: 'en', audience: 'adults', minAge: 16, weeks: 12, fees: [], color: '#7B3FE4' },
  { name: 'English – Children', language: 'en', audience: 'children', minAge: 6, maxAge: 15, weeks: 10, fees: [], color: '#A855F7' },
  { name: 'Spanish – Adults', language: 'es', audience: 'adults', minAge: 16, weeks: 12, fees: [], color: '#F59E0B' },
];
const HOURS_PER_WEEK = 6; // adults: 2 × 3 h or 3 × 2 h; kids: change below if needed
const KIDS_HOURS_PER_WEEK = 3;

const apply = process.env.APPLY === '1';
await initializeDb();
console.log(`Database: ${mongoose.connection.name} (${apply ? 'APPLY' : 'dry run — nothing written'})`);
const say = (what, created) => console.log(`  ${created ? (apply ? '+ created ' : '+ would create') : '· exists, skipped'}  ${what}`);

// Settings: only fill fields that are still empty.
const current = (await databaseApi.getSettings()) ?? {};
const missing = Object.fromEntries(Object.entries(SETTINGS).filter(([k]) => current[k] == null || current[k] === ''));
say(`settings ${Object.keys(missing).length ? JSON.stringify(missing) : '(school name, currency… already set)'}`, Object.keys(missing).length > 0);
if (apply && Object.keys(missing).length) await databaseApi.updateSettings(missing);

for (const c of CAMPUSES) {
  const exists = await m.campusesCollection.exists({ code: c.code });
  say(`campus ${c.code} ${c.name} (${c.rooms.length} rooms)`, !exists);
  if (apply && !exists) await m.campusesCollection.create(c);
}

const langIds = {};
for (const l of LANGUAGES) {
  const found = await m.languagesCollection.findOne({ code: l.code }).lean();
  say(`language ${l.code} ${l.name}`, !found);
  langIds[l.code] = found?._id ?? (apply ? (await m.languagesCollection.create(l))._id : null);
}

for (const { language, weeks, fees, ...p } of PROGRAMS) {
  const exists = await m.programsCollection.exists({ name: p.name });
  const perWeek = p.audience === 'children' ? KIDS_HOURS_PER_WEEK : HOURS_PER_WEEK;
  const levels = defaultLevelNames(p.audience).map((name, i) => ({ number: i + 1, name, durationWeeks: weeks, hours: weeks * perWeek, fee: fees[i] ?? 0 }));
  say(`program "${p.name}": ${levels.map((l) => `${l.name} ${l.fee}`).join(', ')}`, !exists);
  if (apply && !exists) await m.programsCollection.create({ ...p, language: langIds[language], levels });
}

if (PROGRAMS.some((p) => !p.fees.length)) console.log('\nFees are 0: enter the real fees in Programs & levels before enrolling students.');
await disconnectDb();
