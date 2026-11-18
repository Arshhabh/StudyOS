# StudyOS

StudyOS brings coursework, revision, focus sessions, notes, and habits into one student workspace. The guest dashboard opens with editable example records for Alex Morgan. Signing in opens a separate personal workspace.

## Run locally

Use Node.js 22.12 or later and pnpm. From this directory, run:

```sh
pnpm install
pnpm dev
```

Open the local address printed by Next.js. For a production preview with offline support, run:

```sh
pnpm build
pnpm start
```

The preview server binds to loopback on port 3000. Set the `PORT` environment variable to choose another port. Changes to public Supabase configuration require a rebuild.

## Workspace

| Area            | Actions                                                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard       | View the current day, time, agenda, study totals, deadlines, streak, and productivity score. Start a session or add a task.                                                                    |
| Tasks           | Create, edit, complete, delete, reorder, filter, and search tasks. Add subtasks and daily or weekly recurrence.                                                                                |
| Assignments     | Track status, priority, subject, due date, notes, and a downloadable attachment. Review deadline alerts and completion trends.                                                                 |
| Exams           | Manage the timetable, location, syllabus, preparation percentage, and revision checklist. Schedule a revision block directly from an exam card.                                                |
| Calendar        | Switch among day, week, and month. Drag scheduled entries between dates. Create events or reminders using the day controls.                                                                    |
| Focus timer     | Run 25/5, 50/10, 90/20, or custom focus and break lengths. Track subjects with a countdown or stopwatch. Saving a stopwatch session adds its elapsed time to analytics.                        |
| Habits          | Check in daily, inspect 7-day and 30-day history, and earn streak badges.                                                                                                                      |
| Notes           | Edit rich text or Markdown, preview, pin, search, and organize by subject folder. Note edits save on the device as you type.                                                                   |
| Goals           | Set academic, semester, skill, and personal goals. Complete milestones to update progress and earn a completion badge.                                                                         |
| Analytics       | Explore study hours, subjects, focus minutes, task and assignment completion, habit rates, and productivity trends.                                                                            |
| Study assistant | Generate a study plan from deadlines and revision needs. Cloud accounts can use the deployed AI function. The offline planner supplies agenda-based guidance locally and labels its responses. |
| Student tools   | Calculate credit-weighted GPA and CGPA on a 10-point scale, attendance, and percentages. Track GPA by semester.                                                                                |
| Settings        | Edit a profile and photo, switch appearance, enable notifications, manage cloud sync, and export or import workspace records.                                                                  |

**Keyboard shortcuts.** Ctrl/Cmd + K opens search. N creates a task outside text fields. Escape dismisses a dialog.

**Study time.** Completed focus sessions and saved stopwatch sessions contribute to study totals. The productivity score combines progress toward 120 minutes of study (40%), the day’s completed-task fraction (35%), and daily habit completion (25%). Demo data uses local calendar dates.

**Reminders.** The notification center groups overdue items, deadlines within three days, daily habits, and today's events. With permission, the app sends desktop notifications while running. Timers store wall-clock deadlines and reconcile elapsed time when the app reopens.

**Data portability.** Settings exports CSV and JSON. Import merges previously unseen record IDs. Attachments live in IndexedDB for guests or the private Supabase bucket for signed-in students. JSON backups contain attachment references. Analytics opens a print layout that supports the browser’s Save as PDF destination.

## Project structure

```text
app/
  layout.tsx, page.tsx, globals.css
components/
  workspace.tsx          Navigation, search, notifications, and appearance
  dashboard.tsx          Daily overview, agenda, metrics, and activity
  editor.tsx             Record forms, attachments, and checklists
  planner.tsx            Calendar, academic records, tasks, and habits
  focus.tsx              Persistent timers and session history
  notes.tsx              Rich text, Markdown, pinning, and folders
  insights.tsx           Analytics, study assistant, and student tools
  settings.tsx           Profile, authentication, exports, and sync conflicts
  ui.tsx, ui/button.tsx  Shared controls and accessible Radix dialogs
lib/
  model.ts              Domain types, calendar arithmetic, and sample data
  store.ts              Zustand state, local persistence, and mutations
  cloud.ts              Auth client, record synchronization, and file storage
  use-workspace.ts      Account changes, reconnection, and sync scheduling
  utils.ts              Component class composition
supabase/
  config.toml
  migrations/           PostgreSQL schema, policies, storage, and RPCs
  functions/study-assistant/index.ts
prisma/schema.prisma    Database model for Prisma 6 tooling
public/                 Artwork, icons, and PWA manifest
scripts/                Local production server, offline build, and tests
docs/                   Wireframes and production deployment guide
vercel.json             Vercel build and hosting configuration
```

The Next.js 15 App Router exports a static client. PostgreSQL transactions, Auth, private files, and AI requests run on Supabase. The client uses React, TypeScript, Tailwind, shadcn-style Radix components, Framer Motion, Zustand, Recharts, and a locally bundled DM Sans font.

## Verification

```sh
pnpm test
pnpm typecheck
pnpm build
```

The database regression test runs the SQL migrations in embedded PostgreSQL with fixtures for Supabase-managed schemas. It checks owner isolation, direct-write restrictions, stale-write rollback, retry idempotency, and per-user assistant quotas.

See [deployment and backend APIs](docs/deployment.md) and [UI wireframes](docs/wireframes.md).
