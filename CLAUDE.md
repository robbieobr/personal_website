# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website/CV application — a monorepo with a React frontend, Express backend, and MySQL database, orchestrated via Docker Compose.

## Development Commands

### Docker (primary development environment)

```bash
docker compose up                              # Start all services (default seed)
docker compose -f docker-compose.yml -f docker-compose.minimal.yml up   # Minimal seed (1 user)
docker compose -f docker-compose.yml -f docker-compose.full.yml up       # Full seed (3 users)
docker compose down                            # Stop services
docker compose down -v                         # Stop and remove volumes (resets DB)
```

### Frontend (`cd frontend`)

```bash
npm run dev          # Dev server on port 5173 (requires backend running)
npm run dev:mock     # Dev server on port 5173, proxying /api to mock server at 5001 (no DB needed)
npm run mock         # Mock API server on port 5001 (run alongside dev:mock)
npm run build        # Build to /build directory
npm run test         # Run tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Coverage report (90% threshold enforced)
```

### Backend (`cd backend`)

```bash
npm run dev          # Start with tsx watch (auto-reload)
npm run build        # Compile TypeScript to dist/
npm run test         # Run tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Coverage report
```

### SEO tool (`tools/seo`, Python)

```bash
python -m pip install -r tools/seo/requirements.txt   # Pillow, fontTools, Brotli
python -m tools.seo --build-dir frontend/build        # Generate into an existing build
python -m pytest tools/seo/tests                      # Run its tests (from the repo root)
```

## Architecture

```
personal_website/
├── frontend/        # React 18 + Vite + TypeScript
├── backend/         # Express + TypeScript + MySQL
├── database/        # SQL migrations, seeds (default/minimal/full), scripts
├── tools/seo/       # Python SEO generator, run in the production image build
└── docker-compose.yml  # Orchestrates mysql, backend (5000), frontend (3000)
```

### Frontend

- **Pages:** `src/pages/` — top-level page components (e.g., `ProfilePage.tsx`)
- **Components:** `src/components/` — reusable UI (UserProfile, ContactInfo, JobHistory, EducationHistory, Projects, Skills, Achievements, ErrorBoundary)
- **Services:** `src/services/api.ts` — native `fetch` client (10s `AbortSignal.timeout`), proxied via Vite to `/api` → `http://localhost:5000`
- **Types:** `src/types/index.ts` — shared TypeScript interfaces (User, ContactInfo, JobEntry, Education, Project, Skill, Achievement, UserProfile)
- **i18n:** `src/i18n/` — react-i18next config, English (`en`) and Irish Gaeilge (`ga`) locales
- **Header URL:** In production builds (`npm run build`), the header link text shows `VITE_APP_URL` from `frontend/.env.production`. In development it shows the i18n app title. See `frontend/.env.production.example`.

Loading states use `react-loading-skeleton`. Language switcher is in `App.tsx`.

### Backend

Follows MVC: **Routes → Controllers → Models → Database**

- `src/routes/` — defines endpoints (`/api/users`, `/api/contact-info`, `/api/jobs`, `/api/education`, `/api/projects`, `/api/skills`, `/api/achievements`)
- `src/controllers/` — request handling and input validation
- `src/models/` — parameterized SQL queries via MySQL connection pool
- `src/config/database.ts` — MySQL connection pool (limit: 10)

Error responses use generic messages; details are logged server-side only.

### SEO tool

A standalone Python package, run from the `seo` stage of `frontend/Dockerfile`
after the SPA is built. It reads the canonical domain from the deployment's
`Caddyfile` and the site owner from `database/prod-initdb.d/500_prod_seed.sql`,
then rewrites the head of the built `index.html` (title, description, canonical,
Open Graph, Twitter Card, schema.org JSON-LD) and writes `robots.txt`,
`sitemap.xml` and a 1200x630 `og-image.png` beside it.

Both sources are gitignored deployment state. When either is absent, unreadable
or still holds its template placeholders the tool writes nothing and exits 0, so
a build without deployment data succeeds. `docker-compose.yml` targets the
`builder` stage, so development never runs the tool at all.

The card is drawn in the site's own self-hosted faces: fontTools decompresses
the woff2 files to TrueType in memory, since FreeType cannot read woff2.

### Database

- MySQL 8.0 with foreign key constraints and CASCADE deletes
- Migrations in `database/migrations/` (run in order 001–009): users, job_history, education, projects, skills, achievements, contact_info (normalised from users in 008/009)
- Seeds in `database/seeds/` with three profiles: `default`, `minimal`, `full` (each full profile includes all tables; `001_users.sql` in each profile also seeds `contact_info`)
- Pre-combined init directories in `database/init/` for compose override files (`docker-compose.minimal.yml`, `docker-compose.full.yml`); with 9 migrations, seed files are numbered 010–015
- `database/docker-entrypoint-initdb.d/` pre-populated with default seed; used by `docker compose up`
- `database/prod-initdb.d/` for production deployment (migrations only; add `500_prod_seed.sql`)
- Use `database/scripts/init.sh [seed_type]` after `reset.sh` to rebuild `docker-entrypoint-initdb.d/`
- Timestamps (`createdAt`, `updatedAt`) managed by the DB
- `contact_info` uses snake_case columns (`user_id`, `display_order`); the model query aliases these to camelCase (`userId`, `displayOrder`) for TypeScript consistency

## Key Conventions

- **Types:** Frontend types omit DB timestamps; backend types include `createdAt`/`updatedAt`
- **Coverage:** 90% threshold on all metrics (branches, functions, lines, statements)
- **Mock server:** `frontend/mock/mockServer.ts` runs on port 5001 for frontend-only dev
- **Env vars:** Copy `.env.example` → `.env` in both root and `backend/` before running locally
- **Node.js:** ≥20.0.0 required; npm ≥10.0.0
