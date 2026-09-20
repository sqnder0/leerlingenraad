# Leerlingenraad Planning App

## Context

The leerlingenraad (student council) runs multiple events per year and relies on volunteers to help organize/staff them. Today there's no shared system: no controlled member list, no shared calendar to RSVP to, and no fair way to track who's pulled their weight so effort spreads evenly across members. There's also a recurring manual task — telling the school office who should be `vrijgeroosterd` (excused from class) to help with an event — that today has to be reconstructed by hand.

This app fixes that: members authenticate, get admin-approved, RSVP to events on a shared calendar, and an internal (admin-only) points ledger tracks effort per member so organizers can see at a glance who's over/under-contributing. The same signup data doubles as the vrijroosteren report for the school office.

Greenfield build — the project directory is currently empty. Stack, hosting, and key tradeoffs below were confirmed directly with the user.

## Confirmed decisions

- **Stack**: Next.js (App Router) + TypeScript, Postgres, Prisma.
- **Auth now**: fallback credentials (username = first name, password = last name, both admin-entered when a member is added). New accounts start `PENDING`; an admin explicitly approves or rejects before the member gets real access.
- **Auth later**: Smartschool OAuth, once the school's Smartschool admin registers an OAuth app and hands over client credentials — that's a manual, out-of-band step for the user, not something buildable now. The auth layer is architected so this slots in later without a data-model rework.
- **Known tradeoff, accepted deliberately**: first-name/last-name-as-password is guessable by anyone who knows a member's name. Acceptable short-term because this is a low-sensitivity internal club tool, and the real fix (Smartschool OAuth) is already the plan — not solving this with password-complexity theater in the meantime.
- **Points**: hybrid. Each event has an admin-set base `pointValue`. Points are awarded automatically, but only once an admin confirms actual attendance post-event (not just RSVP intent) — avoids rewarding no-shows. Admins can also manually adjust a member's points with a reason (ledger-style, auditable). **Individual ledger detail (who has what, and why) is admin-only** — enforced structurally, not just hidden in the UI (see §3). The one deliberate exception: a member's own balance plus the school-year average across the rotation pool is shown on their dashboard, so people can see how much they should still contribute — never another member's individual balance.
- **Vrijroosteren**: read-only report derived from existing signup data — no separate approval workflow. Grouped by date, showing member name + class + event, exportable as CSV and print-friendly.
- **Data retention**: points/signup history is archived per school year rather than kept as one indefinite pool. Members' accounts persist across years (people stay on the council for multiple years), but the fairness view is scoped to the _active_ school year, with prior years viewable as read-only archives. This needs a `SchoolYear` concept from the start (see §1).
- **Hosting**: self-host via the user's existing Dokploy instance (Docker + Postgres), not Vercel/managed cloud.
- **Recurring duty rotation** (added M3, reworked later to be points-based and trimester-free): some events repeat weekly (e.g. schoolwinkeltje bemannen) and shouldn't rely on open RSVP — the system auto-assigns who's on duty each week, spreading the load evenly. Rotation pool: all `APPROVED` users with `isTeacher = false` (role doesn't matter — non-teacher admins are included). Occurrences are generated on a rolling basis — each `RecurringSeries` has its own `weeksAhead` setting, and the app keeps that many weeks generated at all times (periodic job in `instrumentation.ts`, plus a manual "genereer nu" trigger) — replacing the original whole-trimester-at-once generation. Each new occurrence goes to whoever has the lowest _projected_ points balance (current balance plus points from their own already-scheduled-but-not-yet-awarded signups, so a pick doesn't just reflect the past but accounts for what's already coming), so balances converge toward equal by the end of the school year; the immediately preceding occurrence's picks are excluded from the next one (falling back to allowing a repeat only if the pool is too small) so the same person can't be handed the duty two weeks running. If an assigned member can't make it, they decline and the system immediately reassigns that slot the same way — no admin step needed, no penalty to the decliner.
- **First-admin bootstrap** (added M8): no self-registration exists anywhere in this app, which is a chicken-and-egg problem on a brand new deploy — no admin exists yet to create the first account via `/admin/members/new`. `POST /api/bootstrap` (outside the auth-gated app entirely) solves this: it requires a `BOOTSTRAP_SECRET` env var as a header AND only ever works while the `users` table is empty, so it self-disables permanently after the first real admin is created. See README "Inloggen".

## 1. Data model (Prisma / Postgres)

**SchoolYear**

- `id`, `label` (e.g. `"2025-2026"`), `startsAt`, `endsAt`, `isActive` (bool — exactly one active at a time, enforced in the "start new year" action, not a DB constraint)

**User**

- `id`, `firstName`, `lastName`, `username` (unique; generated as lowercased first name, admin resolves collisions by appending last-name initial, e.g. `sander` → `sanderp`)
- `passwordHash` (nullable — fallback auth; unused once/if only OAuth is linked later)
- `email` (nullable, unique when present — reserved for future Smartschool OAuth linking)
- `smartschoolId` (nullable, unique — reserved for future OAuth provider match)
- `role`: enum `MEMBER | ADMIN`
- `status`: enum `PENDING | APPROVED | REJECTED`
- `classGroup` (nullable string, e.g. `"5A"`) — makes the vrijroosteren export useful to the school office
- `isTeacher` (bool, default false) — excludes an otherwise-`ADMIN` supervising teacher from the duty rotation pool; rotation eligibility is `status = APPROVED && isTeacher = false`, independent of `role`
- `approvedById` (self-relation, nullable), `approvedAt` (nullable)
- `createdAt`, `updatedAt`

**Account / Session / VerificationToken** — standard Auth.js Prisma-adapter tables, created now even though only Credentials is used, so a Smartschool OAuth provider can be added later with zero schema changes.

**RecurringSeries** (added M3 — a weekly duty template, e.g. "Schoolwinkeltje bemannen")

- `id`, `title`, `description` (nullable), `location` (nullable)
- `dayOfWeek` (int, 0 = Sunday .. 6 = Saturday, JS `Date.getDay()` convention)
- `startTime`, `endTime` (string, `"HH:mm"` — combined with each occurrence's date to build that `Event`'s `startAt`/`endAt`)
- `pointValue` (int), `membersNeeded` (int, default 1 — slots to fill per occurrence, `ROTATION` mode only)
- `weeksAhead` (int, default 4) — how many weeks into the future this series' occurrences are kept generated (rolling window, see "Recurring duty rotation" above)
- `assignmentMode`: enum `ROTATION | EVERYONE | SPECIFIC`
- `schoolYearId` (FK), `isActive` (bool, default true)
- `createdById` (User FK), `createdAt`, `updatedAt`

**Event**

- `id`, `title`, `description`, `location`, `startAt`, `endAt`
- `pointValue` (int, admin-set)
- `status`: enum `DRAFT | PUBLISHED | CANCELLED | COMPLETED` (`COMPLETED` = attendance confirmed / points awarded)
- `schoolYearId` (FK — assigned from the active school year at creation time)
- `seriesId` (nullable FK to `RecurringSeries`) — set only on occurrences generated by the roster-generation action, added M3
- `createdById` (User FK), `createdAt`, `updatedAt`

**Signup** (RSVP, and — added M3 — duty assignment)

- `id`, `eventId`, `userId`, unique on `(eventId, userId)`
- `response`: enum `GOING | NOT_GOING`, `respondedAt`
- `autoAssigned` (bool, default false, added M3) — true for signups the rotation algorithm created, vs a member's own RSVP. A member "declining" an auto-assigned signup (flipping it to `NOT_GOING`) is what triggers immediate reassignment (see Recurring duty rotation above); the decliner keeps their lower count, no penalty
- `attended`: enum `UNKNOWN | PRESENT | ABSENT` (default `UNKNOWN`, set by admin post-event) — members may see their own `attended` value, it's harmless and distinct from points
- `pointsAwarded` (bool, default false — idempotency guard so re-running attendance confirmation can't double-award)

**PointsLedger** (admin-only data — never queried from a member-facing code path)

- `id`, `userId`, `delta` (signed int), `reason` (string)
- `type`: enum `EVENT_ATTENDANCE | MANUAL_ADJUSTMENT`
- `eventId` (nullable FK), `signupId` (nullable FK) — set for automated entries
- `schoolYearId` (FK — explicit, since manual adjustments have no event to derive it from)
- `createdById` (User FK — admin who triggered it), `createdAt`

Balance = `SUM(delta)` computed on read, scoped to a `schoolYearId` (defaults to the active year). No cached balance column — simpler, no drift risk, and the data volume here is tiny.

"Archiving" a year = creating a new `SchoolYear`, marking it active, and marking the previous one inactive. No data is deleted; the fairness dashboard and event creation just default to the active year, with a year-selector to browse prior years read-only. A separate, explicit "delete member" admin action (hard delete, confirm dialog) covers the rare case of someone requesting full data removal — this is _not_ automatic or tied to year-end.

**Duty-rotation algorithm** (M3): generating a trimester's roster for a `RecurringSeries` walks each matching weekday in the trimester's date range in order, creating one `Event` per occurrence; for each, it picks `membersNeeded` users from the eligible pool (`APPROVED`, `isTeacher = false`) with the fewest `autoAssigned` `GOING` signups so far this trimester (counted across _all_ series, not just this one), ties broken by whoever was least recently assigned. Declining (`GOING` → `NOT_GOING` on an `autoAssigned` signup) re-runs that same pick for just the vacated slot, excluding the decliner and anyone already on that event.

## 2. Auth architecture

- **Auth.js v5** with `PrismaAdapter`, `CredentialsProvider` registered now; provider array leaves room for a Smartschool OAuth entry later with no session/schema changes.
- `authorize()` only checks username/password correctness — it does **not** gate on `status`. Gating happens post-authentication so a `PENDING` user still reaches an "awaiting approval" page instead of a bare access-denied.
- **Password hashing**: argon2id (`@node-rs/argon2`) — hash properly even though the underlying secret is low-entropy; no excuse to store plaintext.
- **Session strategy**: JWT carrying `userId`, `role`, `status` as a fast UI hint only. **Never trust the token for actual authorization** — always re-check against the DB (see below), so an admin approving/promoting someone takes effect immediately instead of waiting for token refresh.
- **Two-layer gating**:

1.  `middleware.ts` (edge): coarse check — session exists? If not, redirect `/login`.
2.  `app/(protected)/layout.tsx` (Node runtime): fresh Prisma lookup of current `status`/`role` on every request. `PENDING` → `/pending`, `REJECTED` → `/rejected`, else render.
3.  `app/(protected)/admin/layout.tsx`: same pattern, additionally requires `role === ADMIN`.

## 3. Keeping points admin-only (defense in depth)

1. **Module boundary**: `src/lib/data/points.ts` is the only module allowed to query `PointsLedger`. Imported only from `app/(protected)/admin/**` and `actions/admin/**`.
2. **Explicit guard**: every admin server action/page starts with `await requireAdmin()`.
3. **Allowlist DTOs**: member-facing data functions (`lib/data/members.ts`, `events.ts`, `signups.ts`) return explicitly shaped objects, never a raw Prisma row spread — so a future column added to `User`/`Signup` can't accidentally leak through an existing member route.
4. **Server actions split by audience**: `actions/member-actions.ts` (RSVP, own profile) vs `actions/admin/*` (approvals, event CRUD, attendance, points) — the file split makes the authorization boundary visible at a glance.
5. **Lint/CI guard**: `no-restricted-imports` (or a grep check in CI) forbidding `lib/data/points` imports outside `app/(protected)/admin` and `actions/admin`.

## 4. Core routes

**Public**: `/login`, `/pending`, `/rejected`

**Member-facing** (`(protected)`, status `APPROVED`; admins also get full member access)

- `/dashboard` — upcoming events summary
- `/events` — agenda list grouped by month (not a full calendar-grid widget in v1 — RSVP-on-a-list covers the actual requirement; can upgrade later)
- `/events/[eventId]` — details + RSVP toggle, shows who else is going, never points; for a `RecurringSeries` occurrence, the toggle is replaced by an assignment badge + "kan niet" (decline) action
- `/my/signups` — own RSVP/attendance history, incl. upcoming duty assignments
- `/profile` — view own info (name, class)

**Admin-facing** (`(protected)/admin`, role `ADMIN`)

- `/admin` — pending-approval count, upcoming events
- `/admin/members`, `/admin/members/new` (generates username/password, shown once for handoff), `/admin/members/[id]` (status/role, points ledger, manual adjustment)
- `/admin/events`, `/admin/events/new`, `/admin/events/[id]/edit`
- `/admin/events/[id]/signups`, `/admin/events/[id]/attendance` (present/absent checklist → idempotent points-award action, sets event `COMPLETED`)
- `/admin/series`, `/admin/series/new`, `/admin/series/[id]/edit` — manage `RecurringSeries` templates (day/time/point value/members needed/weeksAhead/assignment mode); each active series keeps its own rolling window generated automatically, with a manual "genereer nu" trigger per series for an immediate top-up
- `/admin/invites`, `/admin/invites/new` — generate/revoke self-registration invite links (optional label/expiry/max-uses)
- `/admin/points` — fairness dashboard, sortable by balance, filterable by class, year-selector (defaults to active school year)
- `/admin/school-years` — list years, "archive current & start new year" action
- `/admin/vrijroosteren` — date-range report (date, event, member name, class); `/admin/vrijroosteren/export` — CSV route handler; report page itself is print-stylesheet-friendly

Mutations go through Server Actions + Zod validation (simpler than tRPC at this scale); the member/admin action-file split doubles as the authorization boundary from §3.

## 5. Scaffolding & libraries

- Next.js App Router + TypeScript, Tailwind + shadcn/ui (fast, accessible CRUD-heavy admin UI with little custom CSS)
- Prisma + Postgres
- Auth.js v5 + PrismaAdapter
- `@node-rs/argon2` for password hashing
- Zod for validation everywhere; react-hook-form for the richer admin forms (member/event creation); plain forms + server actions for RSVP
- date-fns for date handling
- **Local dev**: Docker Compose (`postgres:16`), `.env` / `.env.example`, Prisma seed script (one admin + a few sample members/events)
- **Deploy**: Dockerfile for the Next.js app, deployed via the user's existing Dokploy instance alongside a Dokploy-managed Postgres service
- Testing: Vitest for unit tests (points idempotency, auth gating helpers) from early on; Playwright deferred to the polish milestone

## 6. Build order

- **M0 — Scaffold**: `create-next-app` (TS, App Router, Tailwind), git init, ESLint/Prettier, Docker Compose Postgres, `.env.example`, README
- **M1 — Data model**: Prisma schema (incl. `SchoolYear`), migrations, seed script
- **M2 — Fallback auth + approval gating**: Auth.js config, hashing, `/login`, protected-layout status gating, `/pending`/`/rejected`, admin member creation + approval queue
- **M3 — Events + RSVP + duty rotation**: admin event CRUD (scoped to active school year), member events list/detail, RSVP action, `/my/signups`; plus `RecurringSeries`/`Trimester` models, roster-generation algorithm, decline-and-reassign action, admin series/trimester management UI
- **M4 — Attendance + points**: attendance confirmation UI, idempotent points-award action, `lib/data/points.ts` + import-restriction guard, fairness dashboard, manual adjustment
- **M5 — School-year archiving**: `/admin/school-years`, "start new year" action, year-selector on the points dashboard and event list
- **M6 — Vrijroosteren report**: date-range query joining Signup/Event/User, printable view + CSV export
- **M7 — Polish/hardening**: login-attempt throttling, mobile responsiveness (members will mostly use phones), empty states, Vitest coverage for points idempotency + gating, accessibility pass
- **M8 — Deploy**: Dockerfile, Dokploy app + Postgres service setup, env/secrets, migration step on deploy, smoke test
- **M9 (future, blocked on external action)**: add Smartschool OAuth provider once the school hands over credentials; design account-linking (match by email, or admin manually links an existing fallback account to the new Smartschool identity); decide whether fallback login stays enabled per-user or is retired globally

## 7. Open items (small decisions, don't block the build)

1. Contact the school's Smartschool administrator to register an OAuth app (name/class/email scopes) — out-of-band, no ETA, doesn't block M0–M8.
2. Whether email notifications are ever needed (approval confirmation, new-event announcement) — out of scope for v1, would need a transactional email provider if added later.
3. Whether v1 needs event capacity/waitlist enforcement — assumed no, RSVP stays simple GOING/NOT_GOING, changeable anytime pre-event.
4. Production Postgres backup strategy on Dokploy.

## Verification

- `docker compose up -d` for local Postgres, `pnpm dev` for the app; manual smoke test of: register a fallback account → admin approves → member RSVPs to a seeded event → admin confirms attendance → points ledger entry appears in `/admin/points` and balance is correct → member's own UI/API responses contain no points data (check network tab) → vrijroosteren export for that date includes the member.
- Vitest: points-award idempotency (running attendance confirmation twice doesn't double-award), status-gating middleware/layout redirects for `PENDING`/`REJECTED`/`MEMBER`-on-admin-route.
- Before M8: deploy to Dokploy staging, confirm migrations run on deploy, confirm env secrets are set, do the same smoke test against the deployed instance.
