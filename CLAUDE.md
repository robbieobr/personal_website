# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

Human-facing documentation lives in `docs/` — see `docs/README.md` for the index. This file is
agent-facing: facts about the tree, not a tutorial. Do not duplicate `docs/` here.

## Project overview

Robbie O'Brien's CV, as a full-stack application. React SPA, Express read-only JSON API, MySQL,
orchestrated by Docker Compose, fronted by nginx and Caddy in production.

npm workspaces monorepo: `frontend`, `backend`, `e2e`, one root `package-lock.json`. Install from
the root with `npm ci` — never inside a workspace. Plus `tools/seo`, a Python package that runs only
inside an image build.

Node 24 everywhere: `.nvmrc`, both Dockerfiles (`node:24-alpine`), all CI jobs, and
`engines.node: ">=24.0.0"` in all four `package.json` files. npm ≥ 10.

## Commands

### Root

```bash
npm ci                  # install every workspace
npm run lint            # eslint . (flat config, eslint.config.js)
npm run format          # prettier --write .
npm run format:check    # CI check — Markdown included
npm run test:e2e        # Playwright, needs `docker compose up -d` first
npm run test:e2e:headed # same, visible browser
npm run test:e2e:ui     # same, Playwright UI mode
```

### Workspaces

```bash
npm run dev --workspace=frontend            # Vite on 5173 (PORT overrides)
npm run dev:mock --workspace=frontend       # Vite, /api → mock server on 5001
npm run mock --workspace=frontend           # mock API server on 5001
npm run build --workspace=frontend          # → frontend/build
npm run typecheck --workspace=frontend      # tsc --noEmit
npm run test --workspace=frontend           # vitest run — 126 tests, 13 files
npm run test:coverage --workspace=frontend  # 90% threshold, all four metrics

npm run dev --workspace=backend             # tsx watch, port 5000
npm run build --workspace=backend           # tsc -p tsconfig.build.json → dist/
npm run typecheck --workspace=backend
npm run test --workspace=backend            # vitest run — 87 tests, 19 files
npm run test:coverage --workspace=backend   # 90% threshold, all four metrics
```

### Docker

```bash
docker compose up -d                                                        # default seed
docker compose -f docker-compose.yml -f docker-compose.minimal.yml up -d    # minimal seed
docker compose -f docker-compose.yml -f docker-compose.full.yml up -d       # full seed
docker compose down -v                                                      # also drops the DB volume
```

Seeds load only when the MySQL volume is created. Switching profiles requires `down -v` first.

`database/scripts/init.sh` and `reset.sh` are tracked mode 644 — not executable. Invoke as
`bash database/scripts/init.sh [default|minimal|full]`.

### SEO scripts (`tools/seo`, Python 3.13)

```bash
python -m pip install --requirement tools/seo/requirements.txt   # Pillow, fontTools, Brotli
python tools/seo/generate_seo.py --build-dir frontend/build --site-url yourdomain.com
python -m pytest tools/seo                                       # 17 cases
```

## Layout

```
frontend/        React 18.3 + Vite 7.3 + TypeScript 5.9
backend/         Express 5.2 + TypeScript + mysql2
e2e/             Playwright specs — 110 tests, 6 files
database/        migrations, seeds (default/minimal/full), init dirs, scripts
tools/seo/       Python SEO generator, run in the frontend image's `seo` stage
docs/            Human-facing documentation
Caddyfile.example, docker-compose.host.yml.example   templates for gitignored deployment state
```

## Frontend

- `src/App.tsx` — skip link, header (site link, Download CV → `window.print()`, EN/GA toggle, theme
  menu), one `<main id="main-content">`, footer. Exactly one `<main>` and one page-level `<h1>`
  (`UserProfile.tsx`; `ErrorBoundary`'s only renders after a crash).
- `src/pages/ProfilePage.tsx` — fetches user 1, renders skeletons, error (`role="alert"`) and empty
  states, and a permanently mounted `role="status" aria-live="polite"` region.
- `src/components/<Name>/<Name>.tsx` + `<Name>.css` — one directory per component: UserProfile,
  ContactInfo, JobHistory, EducationHistory, Projects, Skills, Achievements, ErrorBoundary.
- `src/services/api.ts` — native `fetch`, 10s `AbortSignal.timeout`, throws on non-2xx. No axios,
  no HTTP dependency. Always requests `/api`, proxied by Vite in dev and nginx in production.
- `src/themes/index.ts` — five palettes (`light`, `dark`, `high-contrast`, `colour-blind`,
  `colour-blind-hc`) as CSS custom property maps. `src/hooks/useTheme.ts` applies them to
  `document.documentElement.style` and persists to the `portfolio-theme` localStorage key.
- `src/i18n/` — react-i18next, `en` and `ga`. Both locale files must stay key-identical; use the
  `add-translation` skill and the `i18n-reviewer` agent.
- `src/utils/date.ts` — formats in UTC (the API serialises MySQL `DATE` as midnight UTC) and carries
  its own Irish month names, because Chromium ships no `ga` date data but Node's full-ICU build does.
- `frontend/public/fonts/` — self-hosted Cormorant Garamond and DM Sans woff2. No Google Fonts
  request exists; the CSP relies on that.
- `frontend/index.html` is the Vite entry point at the workspace root, not under `public/`.
- `VITE_APP_URL` from `frontend/.env.production` is the header and footer link text in production
  builds; in development the i18n app title is used. `VITE_*` values are baked in at build time.
- Every component has a print stylesheet under `@media print`; `e2e/tests/print.spec.ts` covers it.

## Backend

Routes → controllers → models → pool. All routes are `GET`; there is no write path.

- `src/routes/` — `/api/users`, `/api/contact-info`, `/api/jobs`, `/api/education`, `/api/projects`,
  `/api/skills`, `/api/achievements`, plus `GET /api/health` defined inline in `src/index.ts`.
- `src/controllers/` — validate ids through `utils/parseId`, answer their own 400/404.
- `src/models/index.ts` — every SQL statement, parameterised, connection taken from the pool and
  released in a `finally`.
- `src/config/database.ts` — `mysql2/promise` pool, `connectionLimit: 10`, keep-alive on.
- `src/index.ts` — `helmet()`, CORS from `ALLOWED_ORIGINS` (default
  `['http://localhost:3000', 'http://127.0.0.1:3000']`), `express.json({ limit: '10mb' })`,
  `app.set('trust proxy', 1)`, and `errorHandler`.
- `errorHandler` delegates when `res.headersSent` (Express 5 forwards rejected promises), preserves
  a middleware-supplied status, and sends a generic message from a fixed table. `err.message` never
  reaches the client; stacks are logged server-side only.

## Database

- MySQL 8.0, seven tables. Six child tables reference `users(id)` with `ON DELETE CASCADE`.
- Migrations `database/migrations/001`–`009`. No migration runner: the MySQL image executes its init
  directory once, when the volume is first created.
- A new migration must be copied into `database/init/minimal/`, `database/init/full/` and
  `database/prod-initdb.d/` as well, or it exists in some environments and not others.
- In the combined init directories, seeds are renumbered to run after the migrations — with nine
  migrations, `010_users.sql` … `015_achievements.sql`. `init.sh` does this automatically.
- Seed profiles: `default` (John Doe; 3 jobs, 2 education, 2 projects, 6 skills, 2 achievements),
  `minimal` (Jane Smith only), `full` (3 users; 7 jobs, 6 education, 6 projects, 17 skills,
  6 achievements). Each profile's `001_users.sql` also inserts `contact_info`.
- `contact_info` uses snake_case columns (`user_id`, `display_order`); the model aliases them to
  `userId` and `displayOrder` in the `SELECT`.
- `createdAt` / `updatedAt` are database-managed. Frontend types omit them; backend types include
  them.
- `database/prod-initdb.d/500_prod_seed.sql` is gitignored real personal data; only
  `500_prod_seed.sql.example` is tracked.

## Images and production

- `frontend/Dockerfile` has three stages. `builder` (`node:24-alpine`) builds the SPA; `seo`
  (`python:3.13-slim`) runs `tools/seo/generate_seo.py` over that build; `production`
  (`nginx:alpine`) serves the result with `frontend/nginx.conf`, listening on 3000.
- `docker-compose.yml` targets `builder` and overrides the command with `npm run dev`, so
  development never runs the SEO stage.
- The SEO stage needs `SITE_URL` (build arg, from the root `.env`) and the production seed. If
  either is missing or still a placeholder it writes nothing and exits 0.
- `backend/Dockerfile` has two stages; production reinstalls with `--omit=dev` and copies only
  `dist/`.
- `docker-compose.prod.yml` adds Caddy, applies `ports: !reset []` to MySQL and the backend, and
  switches the backend to the read-only DB user. Needs Compose v2.24+ for `!reset`.
- `frontend/nginx.conf` does API proxying with a 100 MB `proxy_cache`, `limit_req` at 10 r/s with
  burst 20, `set_real_ip_from 172.18.0.0/16`, per-path cache-control, and **no SPA fallback** — the
  app has no client-side router, so unknown paths must 404.
- `Caddyfile.example` holds the `hardening` snippet: HSTS, CSP, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, banner removal, and the only
  compression in the chain. nginx's gzip must stay off.
- The real `Caddyfile` and `docker-compose.host.yml` are gitignored deployment state bind-mounted
  into running containers. Never write to them; edit the `.example` templates.

## CI

`.github/workflows/pr-tests.yml` runs on pull requests into `main`, `feat/**`, `chore/**` and
`fix/**` — a base branch outside that set runs no checks. Six jobs: static checks (lint, format,
both typechecks), backend tests + build, frontend tests + build, `pytest tools/seo`, a production
image build (`e2e/tests/docker-production-build.spec.ts`), and an e2e smoke run against
`docker compose up -d`. `e2e-full.yml` runs the whole Playwright suite on pushes to `main`.

## Conventions

- **Comments describe how the code works, never why it was changed.** No "originally", "we
  changed", "after review", no TODOs, no reference to a pull request or reviewer. If a constraint
  only makes sense with history, state the constraint.
- **Commits:** Conventional Commits — `type(scope): imperative subject`, lower case, no full stop.
- **Branches:** `feat/`, `fix/` or `chore/` prefix, or CI will not run on the pull request.
- **Coverage:** 90% on branches, functions, lines and statements, in both workspaces.
- **Formatting:** Prettier (`.prettierrc`: single quotes, semicolons, 2-space indent, ES5 trailing
  commas, 100 columns) covers Markdown too. Run `npm run format` before pushing.
- **Env files:** root `.env` for compose (`.env.example`, `.env.prod.example`), `backend/.env` only
  when running the backend outside Docker, `frontend/.env.production` for the production build.
  `SITE_URL` in the root `.env` is the domain the SEO artefacts are generated for.
