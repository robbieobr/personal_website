# Getting started

Take a fresh clone to a running site. Everything here runs the Docker Compose stack; to run the
frontend or backend directly on your machine, see [Development](development.md).

## What you need

| Tool           | Version | Needed for                                                       |
| -------------- | ------- | ---------------------------------------------------------------- |
| Docker Engine  | 20.10+  | Everything below                                                 |
| Docker Compose | v2      | Everything below                                                 |
| Docker Compose | v2.24+  | The production overlay only — it uses the `!reset` tag           |
| Node.js        | 24      | Running the app or the tests outside Docker (`.nvmrc` pins `24`) |
| npm            | 10+     | Same                                                             |

Node 24 is not optional when you work outside Docker: all four `package.json` files declare
`"engines": { "node": ">=24.0.0" }`, and both Dockerfiles build on `node:24-alpine`.

## First run

```bash
git clone https://github.com/robbieobr/personal_website.git
cd personal_website
cp .env.example .env
docker compose up -d
```

The stack starts in dependency order: MySQL first, and the backend waits on its healthcheck
(`mysqladmin ping`) before starting. A cold first start takes a minute or so, because MySQL runs
every file in `database/docker-entrypoint-initdb.d/` before it accepts connections.

| Service  | Address                                                    | Container                   |
| -------- | ---------------------------------------------------------- | --------------------------- |
| Frontend | <http://localhost:3000>                                    | `personal_website_frontend` |
| API      | <http://localhost:5000/api>                                | `personal_website_backend`  |
| MySQL    | `localhost:3306`, user `root`, database `personal_website` | `personal_website_db`       |

Copying `.env.example` is optional — every variable `docker-compose.yml` reads has a default, so
`docker compose up -d` works in a bare clone. Copy it anyway, because that is where you set
`MYSQL_ROOT_PASSWORD` and `SITE_URL` later. [Configuration](configuration.md) covers what each
variable does.

Both services run their development builds from the `builder` stage with your source bind-mounted,
so edits to `frontend/src`, `frontend/public` and `backend/src` reload without a rebuild.

## The three seed profiles

The database ships with three sets of fictional data, under `database/seeds/`. Each is loaded by a
different compose invocation.

| Profile     | Command                                                                    | Contains                                                                                                   |
| ----------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **default** | `docker compose up -d`                                                     | John Doe, 3 jobs, 2 education records, 2 projects, 6 skills, 2 achievements                                |
| **minimal** | `docker compose -f docker-compose.yml -f docker-compose.minimal.yml up -d` | Jane Smith and her contact details, nothing else — the empty-state case                                    |
| **full**    | `docker compose -f docker-compose.yml -f docker-compose.full.yml up -d`    | John Doe, Jane Smith and Alice Johnson; 7 jobs, 6 education records, 6 projects, 17 skills, 6 achievements |

The frontend always renders user 1, so the minimal profile shows Jane Smith and the full profile
shows John Doe. The other two users in the full profile are reachable through the API
(`/api/users/2/profile`).

**Seeds load once, when the database volume is created.** Pointing compose at a different seed
directory does nothing to a volume that already holds data. To switch:

```bash
docker compose down -v
docker compose -f docker-compose.yml -f docker-compose.full.yml up -d
```

`down -v` deletes the `personal_website_mysql_data` volume, which is what forces MySQL to run its
init directory again.

To load a seed profile through the default `docker compose up` path instead, rebuild the default
init directory first. The scripts are not marked executable in git, so invoke them through `bash`:

```bash
docker compose down -v
bash database/scripts/init.sh full
docker compose up -d
```

`init.sh` copies the nine migrations into `database/docker-entrypoint-initdb.d/`, then copies the
chosen profile's seed files in behind them renumbered from `010` so they run after every
`CREATE TABLE`. [Database](database.md) explains that numbering and how to add a profile.

## Checking it works

```bash
docker compose ps
curl -s http://localhost:5000/api/health
curl -s http://localhost:5000/api/users/1/profile
```

`/api/health` opens a pooled connection and runs `SELECT 1`, so `{"status":"ok"}` means the API can
reach MySQL. It answers `503` with `{"status":"error","message":"Database unavailable"}` when it
cannot — that is the one call worth making before anything else.

Then open <http://localhost:3000>. You should see a name, a job title and contact links in a dark
header band, work history and education in the main column, skills and achievements in the sidebar,
and projects across the foot of the page. The header also carries a **Download CV** button (it opens
the browser print dialogue against a print stylesheet), an EN/GA language toggle, and a theme picker
offering five palettes.

## When the first run does not work

**A port is already taken.** Compose binds 3000, 5000 and 3306 on the host. Find the occupant with
`lsof -i :3000`, or remap the host side in `docker-compose.yml` — `'3001:3000'` keeps the container
port unchanged so nothing else needs to move.

**The page loads but says "This profile didn't load".** The frontend reached the browser but the API
call failed. `frontend` declares only `depends_on: backend`, with no health condition, so on a cold
start the page can render before MySQL has finished initialising. Press **Try again** on the page,
or check the backend:

```bash
docker compose logs -f backend
curl -s http://localhost:5000/api/health
```

**The data is not the seed you asked for.** The volume already existed. Run `docker compose down -v`
and start again; see the seed section above.

**MySQL never becomes healthy.** Read its own log — a syntax error in an init file stops
initialisation and leaves the container restarting:

```bash
docker compose logs mysql
```

**`./init.sh: Permission denied`.** `database/scripts/init.sh` and `reset.sh` are tracked without
the executable bit. Run them as `bash database/scripts/init.sh <profile>`.

**Everything is wedged and you want to start over.** `docker compose down -v` removes the
containers and the database volume; `docker compose up -d --build` rebuilds the images from scratch.

## Next

- [Architecture](architecture.md) — what you just started, and how a request moves through it.
- [Development](development.md) — running the pieces outside Docker, and the mock API.
- [Testing](testing.md) — the unit, end-to-end and SEO suites.
- [Contributing](contributing.md) — conventions and the checks a pull request must pass.
