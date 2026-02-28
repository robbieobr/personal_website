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
npm run dev          # Dev server on port 3000 (requires backend running)
npm run dev:mock     # Dev server with mock backend on port 5001 (no DB needed)
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

## Architecture

```
personal_website/
├── frontend/        # React 18 + Vite + TypeScript
├── backend/         # Express + TypeScript + MySQL
├── database/        # SQL migrations, seeds (default/minimal/full), scripts
└── docker-compose.yml  # Orchestrates mysql, backend (5000), frontend (3000)
```

### Frontend

- **Pages:** `src/pages/` — top-level page components (e.g., `ProfilePage.tsx`)
- **Components:** `src/components/` — reusable UI (UserProfile, JobHistory, EducationHistory, Projects, Skills, Achievements, ErrorBoundary)
- **Services:** `src/services/api.ts` — Axios client (10s timeout), proxied via Vite to `/api` → `http://localhost:5000`
- **Types:** `src/types/index.ts` — shared TypeScript interfaces (User, JobEntry, Education, Project, Skill, Achievement, UserProfile)
- **i18n:** `src/i18n/` — react-i18next config, English (`en`) and Irish Gaeilge (`ga`) locales
- **Header URL:** In production builds (`npm run build`), the header link text shows `VITE_APP_URL` from `frontend/.env.production`. In development it shows the i18n app title. See `frontend/.env.production.example`.

Loading states use `react-loading-skeleton`. Language switcher is in `App.tsx`.

### Backend

Follows MVC: **Routes → Controllers → Models → Database**

- `src/routes/` — defines endpoints (`/api/users`, `/api/jobs`, `/api/education`, `/api/projects`, `/api/skills`, `/api/achievements`)
- `src/controllers/` — request handling, input validation (email/phone regex)
- `src/models/` — parameterized SQL queries via MySQL connection pool
- `src/config/database.ts` — MySQL connection pool (limit: 10)

Error responses use generic messages; details are logged server-side only.

### Database

- MySQL 8.0 with foreign key constraints and CASCADE deletes
- Migrations in `database/migrations/` (run in order 001–007): users, job_history, education, projects, skills, achievements
- Seeds in `database/seeds/` with three profiles: `default`, `minimal`, `full` (each full profile includes all six tables)
- Pre-combined init directories in `database/init/` for compose override files (`docker-compose.minimal.yml`, `docker-compose.full.yml`)
- `database/docker-entrypoint-initdb.d/` pre-populated with default seed; used by `docker compose up`
- `database/prod-initdb.d/` for production deployment (migrations only; add `500_prod_seed.sql`)
- Use `database/scripts/init.sh [seed_type]` after `reset.sh` to rebuild `docker-entrypoint-initdb.d/`
- Timestamps (`createdAt`, `updatedAt`) managed by the DB

## Key Conventions

- **Types:** Frontend types omit DB timestamps; backend types include `createdAt`/`updatedAt`
- **Coverage:** 90% threshold on all metrics (branches, functions, lines, statements)
- **Mock server:** `frontend/mock/mockServer.js` runs on port 5001 for frontend-only dev
- **Env vars:** Copy `.env.example` → `.env` in both root and `backend/` before running locally
- **Node.js:** ≥20.0.0 required; npm ≥10.0.0
