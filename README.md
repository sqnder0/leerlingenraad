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
- ✅ **M10 — Installeerbare app + push-meldingen**: web-manifest zodat de app als PWA op het
  startscherm kan (`src/app/manifest.ts`), dashboard opgesplitst in "verwacht van jou"
  (opt-out/beurtrol, met afmeld-knop) en "opt-in events" (met aanmeld/afmeld-knop), en een
  automatische pushmelding 24u voor elk event waar je "ik kom" op staat (`src/lib/reminders.ts`,
  via `instrumentation.ts`).

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

## Inloggen

Er is geen self-registratie: accounts worden altijd door een beheerder aangemaakt via
`/admin/members/new`. Lokaal na het seeden kun je meteen in met de dev-logins hierboven.

**Op een verse productie-omgeving bestaat er dus nog niemand om mee in te loggen.** Daarvoor
is er een eenmalige bootstrap-route. Zet eerst `BOOTSTRAP_SECRET` als environment variable op
de Dokploy-app (zelf een willekeurige waarde kiezen), en roep dan éénmalig aan:

macOS/Linux:

```bash
curl -X POST https://leerlingenraad.sqnder.dev/api/bootstrap \
  -H "x-bootstrap-secret: $BOOTSTRAP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Sander","lastName":"Pelgrims","password":"een-echt-sterk-wachtwoord"}'
```

Windows (PowerShell — `curl` is daar een alias voor `Invoke-WebRequest` met andere syntax, en
`cmd.exe` behandelt enkele aanhalingstekens niet als string-afbakening, vandaar dit in plaats
van de curl-versie):

```powershell
$env:BOOTSTRAP_SECRET = "plak-hier-je-secret"

Invoke-RestMethod -Uri "https://leerlingenraad.sqnder.dev/api/bootstrap" `
  -Method Post `
  -Headers @{ "x-bootstrap-secret" = $env:BOOTSTRAP_SECRET } `
  -ContentType "application/json" `
  -Body (@{
    firstName = "Sander"
    lastName  = "Pelgrims"
    password  = "een-echt-sterk-wachtwoord"
  } | ConvertTo-Json)
```

De route werkt maar één keer: zodra er één gebruiker bestaat, geeft ze voorgoed een 403, secret
of niet. Nadien kun je die environment variable laten staan of verwijderen, dat maakt niet meer
uit.

## Push-meldingen

De app kan 24u voor een event waar je "ik kom" op staat (opt-in of automatisch toegewezen) een
pushmelding sturen, via Web Push — geen externe dienst nodig (geen Firebase/OneSignal-account),
wel HTTPS in productie (self-signed of geen HTTPS werkt niet voor Service Workers/Push).

Genereer één keer een VAPID-sleutelpaar (identificeert deze app bij de pushdiensten van de
browsers) en zet ze als environment variables op de Dokploy-app:

```bash
pnpm exec web-push generate-vapid-keys
```

```
VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
VAPID_SUBJECT=mailto:jouw-email@voorbeeld.be
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<zelfde public key>
```

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` is dezelfde waarde als `VAPID_PUBLIC_KEY`, maar dan client-side
beschikbaar (nodig voor `PushManager.subscribe()` in de browser). Zonder deze variables draait
de app gewoon door — er wordt dan alleen geen pushmelding verstuurd.

Een lid schakelt meldingen zelf in via de knop op het dashboard (vraagt browser-toestemming en
registreert het toestel). Een periodieke check (elke 20 minuten, zie `src/instrumentation.ts`)
zoekt events die over ~24u starten en stuurt dan één melding per geabonneerd toestel;
`Signup.reminderSentAt` voorkomt dubbele meldingen.

**iOS-beperking:** Apple ondersteunt Web Push alleen als de app als PWA op het startscherm is
toegevoegd ("Deel" → "Voeg toe aan beginscherm") — in Safari zelf (gewone tab) werkt het niet.
Android/desktop-Chrome en Firefox werken wel meteen in de browser.

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
