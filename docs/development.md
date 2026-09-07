# Development

The day-to-day loop for running this project locally: four ways to start it, when to reach for each, and how to recover when something won't start.

## Prerequisites

Node.js 24 and npm ≥10 (`.nvmrc` pins the Node version). Docker and Docker Compose for any of the Docker-based options. See `ENV_SETUP.md` for the full environment variable reference.

## Ways to run it

| Configuration                             | Command                                                                     | Choose this when                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Full stack, default seed                  | `docker compose up`                                                         | General development — the default                                          |
| Full stack, minimal seed                  | `docker compose -f docker-compose.yml -f docker-compose.minimal.yml up`     | Testing empty/near-empty states                                            |
| Full stack, full seed                     | `docker compose -f docker-compose.yml -f docker-compose.full.yml up`        | Testing with three users and complete history                              |
| Frontend only, mock API                   | `cd frontend && npm run mock` (terminal 1), `npm run dev:mock` (terminal 2) | Frontend work with no backend or database                                  |
| Backend only                              | `cd backend && npm run dev`                                                 | API work, needs a reachable MySQL                                          |
| Vite dev server against a running backend | `cd frontend && npm run dev`                                                | Frontend work against real data, backend already running (Docker or local) |

The three Docker profiles are described in full, including exact row counts, in `docs/database.md`.

### Full stack (Docker)

```bash
docker compose up
```

Starts MySQL, the backend, and the frontend together. The backend and frontend containers build from the `builder` stage of their Dockerfiles and run `npm run dev` inside the container, so both have hot reload: `backend/src` and `frontend/src` + `frontend/public` are bind-mounted in. MySQL waits on a healthcheck before the backend starts; the frontend depends on the backend.

Swap in a different seed with a compose override:

```bash
docker compose -f docker-compose.yml -f docker-compose.minimal.yml up
docker compose -f docker-compose.yml -f docker-compose.full.yml up
```

The override only changes which pre-combined directory MySQL mounts as its init scripts (`database/init/minimal` or `database/init/full`) — it takes effect only on a fresh volume, so reset the database first if one is already running (see below).

Stop with `docker compose down`; add `-v` to also drop the MySQL volume (`docker compose down -v`).

### Frontend against the mock server

```bash
cd frontend
npm run mock       # terminal 1: mock API on port 5001
npm run dev:mock   # terminal 2: Vite dev server on port 5173, proxying /api to the mock server
```

No database or backend needed. The mock server (`frontend/mock/mockServer.ts`) serves one endpoint, `GET /api/users/:userId/profile`, from `frontend/mock/mockUserProfile.json`, with a simulated network delay (`MOCK_NETWORK_DELAY`, default 1000ms).

### Backend only

```bash
cd backend
npm run dev
```

Starts the Express server on port 5000 with `tsx watch` (auto-reload on save). Requires a reachable MySQL — either the `mysql` service from `docker compose up mysql`, or a local MySQL 8.0 instance — and a `.env` in `backend/` (copy `backend/.env.example`). If the database has no tables yet, initialize it first:

```bash
cd database/scripts
./init.sh default   # or minimal, full
```

### Vite dev server against a running backend

```bash
cd frontend
npm run dev
```

Starts the Vite dev server on port 5173, proxying `/api` to `http://localhost:5000` by default (override with `VITE_API_BACKEND`). Pair with either the Docker backend or `cd backend && npm run dev`.

## Ports and dependencies

| Service                          | Port | Depends on                              |
| -------------------------------- | ---- | --------------------------------------- |
| Frontend (Docker, `npm run dev`) | 3000 | Backend                                 |
| Frontend (Vite, local)           | 5173 | Backend on 5000, or mock server on 5001 |
| Backend                          | 5000 | MySQL                                   |
| MySQL                            | 3306 | —                                       |
| Mock API server                  | 5001 | —                                       |

## Resetting state

The MySQL init scripts only run once, against a fresh volume — restarting a container with existing data does not reapply them. To start over:

```bash
cd database/scripts
./reset.sh              # stops containers, drops the MySQL volume, clears docker-entrypoint-initdb.d
./init.sh [seed_type]   # rebuilds docker-entrypoint-initdb.d with migrations + the chosen seed (default, minimal, full)
cd ../..
docker compose up
```

`init.sh` only regenerates `database/docker-entrypoint-initdb.d/` (used by plain `docker compose up`). The minimal and full compose overrides mount pre-combined directories under `database/init/` instead, which are committed as-is rather than generated — see `docs/database.md` for how those two paths differ.

If you only need to clear `node_modules` (Docker keeps its own, this affects local installs):

```bash
rm -rf node_modules frontend/node_modules backend/node_modules e2e/node_modules
npm install
```

## Troubleshooting

| Symptom                                           | Likely cause                                                                                              | Fix                                                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `EADDRINUSE` / port already in use                | Another process, or a previous run, holds the port                                                        | `lsof -i :<port>` then `kill -9 <PID>`, or stop the other stack first                                  |
| Frontend loads but shows an error state / no data | Backend not reachable, or `VITE_API_BACKEND` points at the wrong place                                    | `curl http://localhost:5000/api/users`; check the frontend's proxy target in `frontend/vite.config.ts` |
| Backend can't reach MySQL                         | MySQL not running yet, or wrong `DB_HOST` for the context (`mysql` inside Docker, `localhost` outside it) | `docker compose logs mysql`; confirm `backend/.env` matches how you're running MySQL                   |
| Data doesn't match the seed you expected          | The MySQL volume already existed from a previous run, so init scripts didn't rerun                        | `./database/scripts/reset.sh` then `./init.sh <seed_type>`                                             |
| `Cannot find module` after pulling changes        | `node_modules` out of sync with `package-lock.json`                                                       | `npm install` from the repo root (one lockfile covers frontend, backend and e2e)                       |
| CORS error in the browser console                 | Origin not in `ALLOWED_ORIGINS`                                                                           | Add it to `ALLOWED_ORIGINS` in the relevant `.env` (see `.env.example`)                                |

For test failures, see `docs/testing.md`. For environment variables, see `ENV_SETUP.md`.
