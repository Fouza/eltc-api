# eltc-api

Back-office API for ELTC School (language school, several campuses). Built on the Rangewell architecture
(see `../NEW_PROJECT_BLUEPRINT.md`): Express 5 + MongoDB (Mongoose) + socket.io, native ES modules, no build step.

## Run locally

```bash
cp .env.example .env        # fill MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run seed                # WIPES the database, then loads demo data (3 campuses, ~110 students...)
npm run dev                 # API on http://localhost:3010/api
npm run dev:scheduler       # optional: daily jobs (notifications)
npm run run-jobs            # run every daily job once, now
npm test                    # vitest + supertest on the eltc_test database
```

Demo logins after `npm run seed`: `admin@eltc.school / Admin123!`, and `secretary@`, `accountant@`, `coordinator@eltc.school` with `Staff123!`
(the secretary is limited to Centre Campus to show campus-level access).

## Domain

| Collection | What it is |
|---|---|
| `campuses` | School locations (`status: active / opening / closed`) |
| `languages` | French, English, Spanish… |
| `programs` | A "workshop": one language for one audience (adults, teens, children) with its **levels** (6 by default, each with a fee and duration) |
| `teachers` | Records only, teachers don't log in |
| `groups` | A class: program + level + campus + teacher + weekly `schedule` + capacity + dates |
| `students` | The paper registration form. `status: prospect` + `desiredProgram/desiredLevel` = waiting list |
| `enrollments` | Student in a group, with fee, discount and final result |
| `invoices` | What is owed (installments). Overdue = open and `dueDate` in the past |
| `payments` | Receipts. Every change recomputes the invoice `paidAmount` / `status` |
| `attendances` | One sheet per group per day |
| `exams` | Per group, with `results`. A `final` exam sets each enrollment's `finalResult` |
| `notifications` | Created by the scheduler jobs and some actions, pushed live with socket.io |
| `settings` | One document: school name, currency, pass mark, alert thresholds |
| `users` | Staff accounts with roles and optional campus restriction |
| `logs` | 5xx errors |

## Roles

Defined once in `src/constants/roles.js` (`CAN` = who may write what; every logged-in user may read):
`admin` (school manager: everything, users, settings), `secretary`, `accountant`, `coordinator`.
A user with `campusIds: []` sees every campus; otherwise only theirs (`helpers/campusScope.js`).

## Endpoints (all under `/api`, `Authorization: Bearer <JWT>` except `auth/login` and `health`)

`auth/login` · `me` (+ `/password`) · `users` · `campuses` · `languages` · `programs` · `teachers` ·
`groups` (+ `/:id/attendance`, `/:id/promote`) · `students` (+ `/waiting-list`, `/import`) ·
`enrollments` (+ `/:id/transfer`) · `attendance/sheet` (GET pre-filled, PUT save) · `attendance/alerts` ·
`exams` (+ `/:id/results`) · `invoices` (+ `/:id/cancel`) · `payments` · `notifications` (+ `/read-all`, `/:id/read`) ·
`dashboard` · `search?q=` · `settings`

Errors: `{ status, errorMessage, details? }`.

## Daily jobs (`src/scheduler/jobs/`, separate `scheduler` process)

| Job | Notification |
|---|---|
| `groupLifecycle` | Planned groups become ongoing on their start date; alert when a group passes its end date |
| `overduePayments` | One alert per overdue invoice |
| `paymentsDueSoon` | Daily digest of installments due in the next 3 days |
| `lowAttendance` | Students with ≥ N absences (setting) in the last 30 days |
| `examsNotGraded` | Past exams with no results typed |

Notifications created by the scheduler process are stored; the web app picks them up on its next poll (every 2 min).
Notifications created in the web process (group almost full…) are also pushed instantly over socket.io.

## Adding things

Follow the playbooks in `NEW_PROJECT_BLUEPRINT.md` section 9. After adding a data function file, regenerate the barrel:
`node src/scripts/buildDatabaseApiIndex.js`.
