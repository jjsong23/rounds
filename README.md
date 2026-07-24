# Rounds

Find people to drink and hang out with — a specific group, at a specific
brewery or wine bar, at a specific time, with a capacity cap. See
[CLAUDE.md](./CLAUDE.md) for the full product spec.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Prisma · Auth.js · Vercel.

## Local setup

```bash
npm install
cp .env.example .env   # fill in the values described below
npx prisma migrate dev # applies migrations and generates the client
npm run seed            # seeds venues, tags, groups, test users, rounds
npm run dev
```

The app runs at http://localhost:3000. It targets Postgres everywhere,
including local dev — `DATABASE_URL` must be a real Postgres connection
string (a free [Neon](https://neon.tech) database works fine for this; see
Deploying, below, for creating one).

Sign in with any email address — in dev, without `RESEND_API_KEY` set, the
magic link is printed to the terminal instead of sent. Seeded users:
`alex.kim@example.com` (admin), `priya.patel@example.com`,
`jordan.lee@example.com`, and five more — see `prisma/seed.ts`.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string, dev and production alike |
| `AUTH_SECRET` | yes | Auth.js session encryption key — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | for Google sign-in | OAuth credentials from the Google Cloud Console |
| `EMAIL_FROM` | no | From-address for magic link emails (defaults to a placeholder) |
| `RESEND_API_KEY` | for production email | Enables real email delivery via Resend; omit in dev to log links to the console instead |
| `CRON_SECRET` | recommended in production | Bearer token required by `/api/cron/sweep-dormant-groups` |

## Database

- `npx prisma migrate dev --name <name>` — create and apply a migration after
  changing `prisma/schema.prisma`.
- `npx prisma migrate deploy` — apply existing migrations without prompting
  (used in production and CI).
- `npm run seed` — re-run `prisma/seed.ts` (adds rows; it does not clear
  existing data first).
- `npx prisma studio` — browse the database.

## Tests

```bash
npm test
```

Vitest, running against the same database as `npm run dev`. Tests create
their own throwaway users/rounds/groups and clean up after themselves. Test
files run sequentially (`fileParallelism: false` in `vitest.config.ts`) —
inherited from when local dev used SQLite (single-writer); left in place
since it costs little and there's no need for it to race Postgres either.

## Scheduled jobs

`GET /api/cron/sweep-dormant-groups` marks groups DORMANT once
`lastRoundAt` is more than 60 days old. Point a scheduler (Vercel Cron, or
any external one) at it with an `Authorization: Bearer $CRON_SECRET` header.
Reviving a group (posting a new round) always happens inline in the same
request — this sweep only needs to run periodically, not reliably, since the
correctness-critical direction is the revive, not the dormancy mark.

## Deploying (Vercel + Neon)

1. Create a Postgres database on [Neon](https://neon.tech) and copy its
   connection string (include `?sslmode=require`).
2. Set `DATABASE_URL` to that string locally and run
   `npx prisma migrate deploy` to apply all migrations, then `npm run seed`
   for starter data.
3. Import the repo into [Vercel](https://vercel.com/new), set the
   environment variables listed above (with the same `DATABASE_URL`) in the
   project settings, and deploy.
4. Every pull request automatically gets its own preview deployment once the
   repo is connected to Vercel — no extra configuration needed. Give preview
   deployments their own Neon branch (Neon supports database branching) if
   you want preview data isolated from production.

## PWA

The app is installable (`app/manifest.ts`, `app/icon.tsx`, `app/apple-icon.tsx`)
and registers a service worker (`public/sw.js`) that caches only the static,
unauthenticated shell — the marketing page, sign-in, and the manifest —
plus Next's hashed static assets. Every `/api/*` call and every
authenticated page is network-only and never cached.

Before shipping, manually verify on real devices (this can't be checked from
a dev environment):
- Install to home screen on iOS Safari and Android Chrome.
- Request a magic link, open it from the Mail app (which opens the system
  browser, not the installed app), complete sign-in there, then reopen the
  installed app — it should already be signed in. This works because the
  session cookie is shared between the system browser and the installed PWA
  on the same origin; there's no special code for it, just correct cookie
  settings (Auth.js's defaults), so it's worth confirming on-device rather
  than assuming.

## Health check

`GET /api/health` — checks the database connection, returns `{ "status": "ok" }`.
