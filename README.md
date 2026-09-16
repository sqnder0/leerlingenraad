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
- ⬜ M2 — Fallback auth + approval gating
- ⬜ M3 — Events + RSVP
- ⬜ M4 — Attendance + points
- ⬜ M5 — School-year archiving
- ⬜ M6 — Vrijroosteren-rapport
- ⬜ M7 — Polish/hardening
- ⬜ M8 — Deploy (Dokploy)
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
pnpm build          # productiebuild
```

Database (Prisma 7, driver adapters, zie `.agents/skills/` voor de volledige conventies):

```bash
pnpm exec prisma migrate dev    # nieuwe migratie genereren + toepassen
pnpm exec prisma generate       # client regenereren na een schema-wijziging
pnpm exec prisma db seed        # seed-data inladen (idempotent)
pnpm exec prisma studio         # data bekijken/bewerken in de browser
```

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

Zelf-gehost via het bestaande Dokploy-project van de gebruiker (Docker + Postgres), zie
`docs/plan.md` §5 en §6 (M8). Nog niet opgezet.
