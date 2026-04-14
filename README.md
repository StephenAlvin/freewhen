# freewhen

Cute, login-free day-scheduling app — a when2meet clone with food / hiking / shopping / games themes. Live at [freewhen.me](https://freewhen.me).

## Stack

- **Frontend:** React 18 + Vite + TypeScript + TailwindCSS + Framer Motion
- **Backend:** Cloudflare Pages Functions (Workers runtime) — file-based routing under `functions/api/`
- **DB:** Cloudflare D1 (SQLite at the edge)
- **Hosting:** Cloudflare Pages at `freewhen.me`
- **Tests:** Vitest + React Testing Library (frontend) + `@cloudflare/vitest-pool-workers` (backend with real D1)

## Prerequisites

- Node.js 20+ and npm
- A Cloudflare account, authenticated via `npx wrangler login` (one-time, opens browser)

## First-time setup

```bash
git clone https://github.com/StephenAlvin/freewhen.git
cd freewhen
npm install
npm run migrate:local     # create local SQLite
```

## Running locally

Two modes depending on whether you need the API.

### Frontend only (fastest, no API)

```bash
npm run dev
# → http://localhost:5173
```

Vite hot reload. API calls will 404 — use this when you're only touching UI.

### Full stack (frontend + API + local D1)

```bash
npm run build
npm run pages:dev
# → http://127.0.0.1:8788
```

Everything works: create events, submit availability, heatmap. Data lives in `.wrangler/state/` (local-only, separate from production).

Re-run `npm run build` (and restart `pages:dev`) whenever you change Functions code or UI.

## Tests

```bash
npm run test            # Runs frontend + workers suites
npx vitest run          # Frontend-only (faster feedback)
npm run test:workers    # Workers (uses miniflare + in-memory D1)
```

## Deploying to production

Production is `freewhen.me`, served by the `freewhen` Cloudflare Pages project. Deploy is manual:

```bash
# 1. Commit your changes
git add -A && git commit -m "…"
git push

# 2. If you added a new migration in migrations/
npm run migrate:remote

# 3. Build and deploy
npm run deploy
```

The deploy uploads `dist/` (static assets) + `functions/` (API handlers) to Cloudflare Pages. Global edge rollout is ~30 seconds after upload.

### Verify production

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://freewhen.me/
# Expect: 200
```

### View production logs

```bash
npm run tail
```

Streams live logs from the deployed Functions. Useful for debugging API errors.

## Project structure

```
freewhen/
├── src/                        React frontend
│   ├── pages/                    HomePage, EventPage (client routes)
│   ├── components/               UI components
│   ├── themes/                   4 theme configs (palette, emojis)
│   ├── lib/                      api.ts, dates.ts, cn.ts
│   └── types.ts                  Shared TS types
├── functions/                  Pages Functions (serverless API)
│   ├── _middleware.ts            Error handler for all routes
│   └── api/
│       ├── events/
│       │   ├── index.ts          POST /api/events
│       │   └── [slug]/
│       │       ├── index.ts      GET  /api/events/:slug
│       │       └── submissions.ts PUT /api/events/:slug/submissions
│       └── _lib/                 db, slug, validation, wordlists
├── migrations/                 D1 schema migrations
├── tests/                      Test setup + helpers
├── wrangler.toml               Cloudflare config + D1 binding
├── vite.config.ts              Vite + Vitest (frontend)
└── vitest.workers.config.ts    Vitest for Workers-runtime tests
```

## Changing the database schema

1. Create `migrations/000N_description.sql` with the new DDL
2. Apply locally: `npm run migrate:local`
3. Apply remotely before deploying the code that depends on it: `npm run migrate:remote`
4. Commit the migration file + `npm run deploy`

## Adding a new theme

1. Create `src/themes/<name>.ts` following the shape of `src/themes/eating.ts`
2. Register it in `src/themes/index.ts`
3. Add a matching `functions/api/_lib/wordlists/<name>.ts` for the slug generator
4. Register it in `functions/api/_lib/wordlists/index.ts`
5. Add the new theme ID to the `ThemeId` union in `src/types.ts` and the `CHECK` constraint in `migrations/0001_init.sql` (or add a new migration to alter the constraint if prod is already deployed)

## Scripts reference

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server for frontend-only work |
| `npm run pages:dev` | Full-stack local server (frontend + API + local D1) |
| `npm run build` | Build static assets into `dist/` |
| `npm run deploy` | Build + push to Cloudflare Pages production |
| `npm run tail` | Tail production logs |
| `npm run migrate:local` | Apply D1 migrations to local SQLite |
| `npm run migrate:remote` | Apply D1 migrations to production |
| `npm run test` | Run all tests (frontend + workers) |
| `npm run test:ui` | Frontend tests in watch mode |
| `npm run test:workers` | Workers tests only |
| `npm run typecheck` | TypeScript check without emit |

## Troubleshooting

**"Authentication error" on deploy:** run `npx wrangler login` again.

**Local D1 errors after migration:** delete `.wrangler/state/` and re-apply migrations with `--local`.

**Tests hang on first workers run:** first invocation downloads the miniflare Workers runtime (~50MB). Subsequent runs are fast.

**Production 522 error:** check `wrangler pages deployment tail` for the actual error; usually a D1 binding issue. Verify `wrangler.toml` has the correct `database_id` and that `Settings → Bindings` in the Cloudflare dashboard shows `DB → freewhen`.
