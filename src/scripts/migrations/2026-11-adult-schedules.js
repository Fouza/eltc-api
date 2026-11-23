// One-off migration (Nov 2026): adult groups move from "any 2 sessions" to one of 3 schedules.
//   Morning sessions → Weekend Morning · afternoon sessions → Weekend Afternoon · evenings only → Evening.
// Renames a group only if it still has the automatic name; a hand-written name is kept.
// Safe to run twice. Dry run by default:
//   node --env-file=.env src/scripts/migrations/2026-11-adult-schedules.js          (preview)
//   APPLY=1 node --env-file=.env src/scripts/migrations/2026-11-adult-schedules.js  (apply)
// Production: export MONGODB_URI='…atlas…' then run the same commands without --env-file.
import mongoose from 'mongoose';
import { levelLabel } from '../../constants/enums.js';
import { ADULT_SCHEDULES, SESSIONS, adultScheduleOf, scheduleFromSessions, sessionsLabel, sortSessions } from '../../constants/sessions.js';

const apply = process.env.APPLY === '1';
await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
console.log(`Database: ${db.databaseName} (${apply ? 'APPLY' : 'dry run'})`);

const programs = Object.fromEntries((await db.collection('programs').find().toArray()).map((p) => [String(p._id), p]));
const languages = Object.fromEntries((await db.collection('languages').find().toArray()).map((l) => [String(l._id), l]));
const oldLabel = (keys) => sortSessions(keys).map((k) => SESSIONS.find((s) => s.key === k)?.label).join(' + ');
const scheduleFor = (keys) => {
  if (keys.some((k) => ['sat_am', 'fri_am'].includes(k))) return ADULT_SCHEDULES.find((p) => p.key === 'weekend_am');
  if (keys.some((k) => ['sat_pm', 'fri_pm'].includes(k))) return ADULT_SCHEDULES.find((p) => p.key === 'weekend_pm');
  return ADULT_SCHEDULES.find((p) => p.key === 'evening');
};

let changed = 0;
for (const g of await db.collection('groups').find().toArray()) {
  const p = programs[String(g.program)];
  if (!p || p.audience === 'children' || !g.sessions?.length) continue;
  const target = adultScheduleOf(g.sessions) ?? scheduleFor(g.sessions);
  const prefix = `${languages[String(p.language)]?.code?.toUpperCase() ?? ''} - ${levelLabel(g.levelNumber, p.levels, p.audience)} Adults`;
  const wasAuto = g.name === `${prefix} ${oldLabel(g.sessions)}`;
  // Already a full schedule with its new-style name (or a custom one): nothing to do.
  if (adultScheduleOf(g.sessions) && !wasAuto) continue;
  const name = wasAuto ? `${prefix} ${sessionsLabel(target.sessions)}` : g.name;
  console.log(`  "${g.name}" [${g.sessions.join(', ')}] -> ${target.label}${wasAuto ? `, renamed "${name}"` : ' (custom name kept)'}`);
  if (apply) {
    await db.collection('groups').updateOne({ _id: g._id }, { $set: { name, sessions: sortSessions(target.sessions), schedule: scheduleFromSessions(target.sessions) } });
    if (wasAuto) {
      for (const f of ['title', 'message'])
        await db.collection('notifications').updateMany({ [f]: { $regex: g.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } }, [{ $set: { [f]: { $replaceAll: { input: `$${f}`, find: g.name, replacement: name } } } }]);
    }
  }
  changed++;
}
const names = (await db.collection('groups').find().project({ name: 1 }).toArray()).map((x) => x.name);
console.log(`${changed} group(s) ${apply ? 'converted' : 'to convert'} · duplicate names: ${JSON.stringify(names.filter((n, i) => names.indexOf(n) !== i))}`);
await mongoose.disconnect();
