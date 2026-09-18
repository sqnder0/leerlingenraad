# Leerlingenraad Planning App

Interne tool voor de leerlingenraad: leden RSVP'en op evenementen via een gedeelde agenda, een
admin-only puntensysteem houdt bij wie zijn steentje bijdraagt, en dezelfde data levert het
vrijroosteren-rapport voor het schoolsecretariaat.

Het volledige plan (datamodel, auth-architectuur, routes, build-order) staat in
[`docs/plan.md`](./docs/plan.md).

## Status

- ✅ **M0 — Scaffold**: Next.js (App Router, TypeScript, Tailwind), ESLint + Prettier, Docker
  Compose Postgres, `.env.example`, dit README.
- ✅ **M1 — Data model**: Prisma-schema (Prisma 7, driver adapters), migratie, seed-script.
- ✅ **M2 — Fallback auth + approval gating**: Auth.js v5 (Credentials, argon2id), `/login`,
  status-gating (`proxy.ts` + `(protected)/layout.tsx`), `/pending`/`/rejected`, admin
  ledenbeheer (aanmaken + goedkeuren/afwijzen).
- ✅ **M3 — Events + RSVP + duty rotation**: eenmalige events (CRUD + RSVP), en wekelijks
  terugkerende events met automatische eerlijke toewijzing per trimester (`RecurringSeries`,
  `Trimester`, herverdeling bij afmelden).
- ✅ **M4 — Attendance + points**: aanwezigheid bevestigen per event (idempotent puntentoekenning),
  admin-only `lib/data/points.ts` (afgedwongen via een eslint-regel), leden-detailpagina met
  ledger + manuele aanpassing, puntendashboard (per schooljaar/klas, admin-only).
- ✅ **M5 — School-year archiving**: `/admin/school-years` (archiveer huidig & start nieuw
  jaar, geen data verwijderd), schooljaar-selector op events en puntendashboard.
- ✅ **M6 — Vrijroosteren-rapport**: `/admin/vrijroosteren`, gegroepeerd per datum, printbaar
  (`print:hidden` op de UI-chrome) en exporteerbaar als CSV via een aparte route handler.
- ✅ **M7 — Polish/hardening**: login-throttling (5 pogingen/15 min per gebruikersnaam), Vitest
  (gating + puntentoekenning-idempotentie), mobielvriendelijke tabellen/lijsten/header,
  ontbrekende lege-staten, `lang="nl"`.
- ✅ **M8 — Deploy**: Dockerfile draait `prisma migrate deploy` automatisch bij het opstarten
  van de container, vóór de server start (faalt de migratie, dan start de container niet).
  Nog manueel te doen op Dokploy: de Postgres-service en de environment variables
  (`DATABASE_URL`, `AUTH_SECRET`) instellen, en een deploy als smoke test draaien.
- ⬜ M9 — Smartschool OAuth (geblokkeerd op extern: school moet OAuth-app registreren)

Zie `docs/plan.md` §6 voor de volledige, gedetailleerde build-order.

## Vereisten

- Node.js 20+
- [pnpm](https://pnpm.io) (`corepack enable` volstaat, dit repo pint de versie via
  `packageManager` in `package.json`)
- Docker (voor lokale Postgres)

## Aan de slag

```bash
pnpm install
cp .env.example .env
docker compose up -d      # start lokale Postgres op localhost:5432
pnpm dev                  # http://localhost:3000
```

Overige scripts:

```bash
pnpm lint           # ESLint
pnpm format         # Prettier — schrijft wijzigingen weg
pnpm format:check   # Prettier — controleert zonder te schrijven
pnpm test           # Vitest (gating + puntentoekenning-idempotentie)
pnpm build          # productiebuild
```

Database (Prisma 7, driver adapters, zie `.agents/skills/` voor de volledige conventies):

```bash
pnpm exec prisma migrate dev    # nieuwe migratie genereren + toepassen
pnpm exec prisma generate       # client regenereren na een schema-wijziging
pnpm exec prisma db seed        # seed-data inladen (idempotent)
pnpm exec prisma studio         # data bekijken/bewerken in de browser
```

Dev-login na het seeden (fallback-auth, wachtwoord = achternaam):
`sander`/`Pelgrims` (ADMIN), `emma`/`Verhoeven`, `lukas`/`Van Damme`, `fien`/`Willems` (PENDING).

## Projectstructuur

```
docs/plan.md         volledig plan: datamodel, auth, routes, build-order
prisma/               schema, migrations, seed-script
src/app/              Next.js App Router
src/lib/prisma.ts     Prisma client singleton (v7 driver-adapter pattern)
docker-compose.yml    lokale Postgres 16 voor development
.env.example          vereiste environment variables
```

## Deploy

Zelf-gehost via het bestaande Dokploy-project van de gebruiker (Docker + Postgres). Bouwt via
een eigen `Dockerfile` in de repo-root (multi-stage, `output: "standalone"`), **niet** via
Dokploy's automatische Nixpacks-detectie: die faalde herhaaldelijk op `corepack` dat de
gepinde pnpm-versie niet kon ophalen. `pnpm` wordt in de image daarom rechtstreeks via `npm`
geïnstalleerd, corepack wordt niet gebruikt.

Bij het opstarten van de container draait automatisch `prisma migrate deploy` (via een kleine,
losstaande toolchain in de image, apart van de standalone Next.js-app) vóór de server start. Als
migraties falen, start de container niet, in plaats van te draaien tegen een verouderd schema.
Seed-data draait bewust **niet** mee bij deploy.

`DATABASE_URL` en `AUTH_SECRET` moeten als environment variables op de Dokploy-app staan.
