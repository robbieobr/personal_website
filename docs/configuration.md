# Configuration

Every environment variable the project reads, which file supplies it, and what happens if it is
left unset. See [deployment](./deployment.md) for turning these into a running production host
and [database](./database.md) for the seed files referenced below.

## Root `.env`

Read by `docker compose` when you run `docker compose up` (development) or add the
`docker-compose.prod.yml` overlay (production). Copy it from `.env.example`:

```bash
cp .env.example .env
```

Only some of the keys in the template are actually interpolated into the compose files — the
rest exist so the file reads as a complete picture of the container's configuration, but their
values are hardcoded in `docker-compose.yml`/`docker-compose.prod.yml` and changing them in
`.env` has no effect.

| Variable               | Required            | Read by                                                                                                                              | Effect when absent                                                                                                                                                                                                                                                                 |
| ---------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MYSQL_ROOT_PASSWORD`  | Dev: no · Prod: yes | `docker-compose.yml`, `docker-compose.prod.yml` (`mysql` service)                                                                    | Dev falls back to `rootpassword`. Prod has no fallback — an empty value leaves the MySQL container unable to initialise.                                                                                                                                                           |
| `MYSQL_DATABASE`       | No                  | Not interpolated — `personal_website` is hardcoded in both compose files                                                             | No effect; the key is informational only.                                                                                                                                                                                                                                          |
| `DB_HOST`              | No                  | Not interpolated — hardcoded to `mysql` in `docker-compose.yml`                                                                      | No effect.                                                                                                                                                                                                                                                                         |
| `DB_PORT`              | No                  | Not interpolated — hardcoded to `3306`                                                                                               | No effect.                                                                                                                                                                                                                                                                         |
| `DB_USER`              | No                  | Not interpolated — hardcoded to `root` in dev                                                                                        | No effect. Production instead reads `DB_READONLY_USER` (below).                                                                                                                                                                                                                    |
| `DB_PASSWORD`          | Dev: no             | `docker-compose.yml` (`backend` service)                                                                                             | Falls back to `rootpassword`, matching the `mysql` service's own default.                                                                                                                                                                                                          |
| `DB_NAME`              | No                  | Not interpolated — hardcoded to `personal_website`                                                                                   | No effect.                                                                                                                                                                                                                                                                         |
| `PORT`                 | No                  | Not interpolated — hardcoded to `5000` for the backend                                                                               | No effect.                                                                                                                                                                                                                                                                         |
| `NODE_ENV`             | No                  | Not interpolated — hardcoded per compose file (`development` / `production`)                                                         | No effect.                                                                                                                                                                                                                                                                         |
| `ALLOWED_ORIGINS`      | Dev: no · Prod: yes | `docker-compose.yml`, `docker-compose.prod.yml` (`backend` service), read as `process.env.ALLOWED_ORIGINS` in `backend/src/index.ts` | Dev falls back to a `localhost:3000,5001,backend:5000` list. Prod has no fallback — an unset or empty value is falsy in `backend/src/index.ts`, so CORS silently falls back to `http://localhost:3000` and `http://127.0.0.1:3000`, rejecting the real site's own frontend origin. |
| `SITE_URL`             | Prod only, optional | `docker-compose.prod.yml` (`frontend` build arg) → `frontend/Dockerfile` → `tools/seo/generate_seo.py --site-url`                    | See [SITE_URL and the SEO build](#site_url-and-the-seo-build) below. Not read at all by the dev compose file.                                                                                                                                                                      |
| `VITE_API_BACKEND`     | No                  | `docker-compose.yml` (`frontend` service) → `frontend/vite.config.ts` dev/preview proxy target                                       | Falls back to `http://localhost:5000`; inside Docker the compose default is `http://backend:5000`.                                                                                                                                                                                 |
| `VITE_API_URL`         | No                  | Not read by any code today                                                                                                           | No effect. Kept in the template for documentation purposes only.                                                                                                                                                                                                                   |
| `DB_READONLY_USER`     | Prod only           | `docker-compose.prod.yml` (`mysql` and `backend` services), `database/prod-initdb.d/900_readonly_user.sh`                            | Falls back to `webapp`.                                                                                                                                                                                                                                                            |
| `DB_READONLY_PASSWORD` | Prod only, required | `docker-compose.prod.yml`, `database/prod-initdb.d/900_readonly_user.sh`                                                             | No fallback. An empty value creates the read-only MySQL user with an empty password, and the backend then fails every query against it.                                                                                                                                            |

## `backend/.env`

Used only when running the backend outside Docker (`cd backend && npm run dev`). Copy it from
`backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

| Variable          | Required | Read by                                                   | Default when absent                                                             |
| ----------------- | -------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `DB_HOST`         | No       | `backend/src/config/database.ts`                          | `localhost`                                                                     |
| `DB_PORT`         | No       | `backend/src/config/database.ts`                          | `3306`                                                                          |
| `DB_USER`         | No       | `backend/src/config/database.ts`                          | `root`                                                                          |
| `DB_PASSWORD`     | No       | `backend/src/config/database.ts`                          | Empty string — a MySQL server requiring a password then refuses the connection. |
| `DB_NAME`         | No       | `backend/src/config/database.ts`                          | `personal_website`                                                              |
| `PORT`            | No       | `backend/src/index.ts`                                    | `5000`                                                                          |
| `NODE_ENV`        | No       | `backend/src/index.ts` (controls test-mode `listen` skip) | Behaves as non-`test`; the server calls `app.listen`.                           |
| `ALLOWED_ORIGINS` | No       | `backend/src/index.ts`                                    | `http://localhost:3000,http://127.0.0.1:3000`                                   |

## `frontend/.env.development`

Loaded automatically by `npm run dev` (Vite's default mode is `development`). Committed as-is —
no `.example` template exists for it because the checked-in file already holds safe local-only
values.

| Variable           | Required | Read by                                                         | Default when absent     |
| ------------------ | -------- | --------------------------------------------------------------- | ----------------------- |
| `VITE_API_BACKEND` | No       | `frontend/vite.config.ts` — dev-server and preview proxy target | `http://localhost:5000` |
| `VITE_API_URL`     | No       | Not read by any code today                                      | No effect.              |

## `frontend/.env.mock`

Loaded by `npm run dev:mock`. Pair it with `npm run mock`, which starts `frontend/mock/mockServer.ts`
on port 5001. Also committed as-is.

| Variable           | Required | Read by                                                         | Default when absent     |
| ------------------ | -------- | --------------------------------------------------------------- | ----------------------- |
| `VITE_API_BACKEND` | No       | `frontend/vite.config.ts` — dev-server and preview proxy target | `http://localhost:5000` |
| `VITE_API_URL`     | No       | Not read by any code today                                      | No effect.              |

The mock server itself reads its own optional `frontend/mock/.env` (copy from
`frontend/mock/.env.example`), plus an untracked `frontend/mock/.env.local` override if present:

| Variable               | Required | Default when absent                                                 |
| ---------------------- | -------- | ------------------------------------------------------------------- |
| `MOCK_PORT`            | No       | `5001`                                                              |
| `MOCK_NETWORK_DELAY`   | No       | `1000` (milliseconds of simulated latency added to each response)   |
| `MOCK_ALLOWED_ORIGINS` | No       | `http://localhost:3000,http://localhost:5001,http://localhost:5000` |

## `frontend/.env.production`

Loaded automatically by `npm run build` and by the `frontend/Dockerfile` production build stage.
Gitignored — create it from the template before building:

```bash
cp frontend/.env.production.example frontend/.env.production
```

| Variable           | Required | Read by                                                                                                    | Effect when absent                                                                   |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `VITE_API_BACKEND` | No       | Baked into the build via `frontend/vite.config.ts`; unused at runtime since nginx proxies `/api/` directly | Falls back to `http://localhost:5000`, which has no effect on the running container. |
| `VITE_API_URL`     | No       | Not read by any code today                                                                                 | No effect.                                                                           |
| `VITE_APP_URL`     | No       | `frontend/src/App.tsx` — shown as the header link text, but only when `import.meta.env.PROD` is true       | The header falls back to the i18n app title instead of a URL.                        |

The root `.dockerignore` excludes `.env` and `.env.*` from the build context, but only at the
context root — it does not anchor with `**/`, so it does not reach nested files. A local
`frontend/.env.production` is therefore still sent to the daemon and copied in by
`COPY frontend/ ./frontend/` in `frontend/Dockerfile`'s builder stage, so `npm run build -w frontend`
inside the image picks it up exactly as a local `npm run build` would. Create the file before
running the production compose build, or the image builds with `VITE_APP_URL` unset and the header
falls back to the i18n title.

## SITE_URL and the SEO build

`SITE_URL` is the one variable in this project where an absent or placeholder value changes what
gets built rather than failing the build.

It flows: root `.env` → `docker-compose.prod.yml` passes it as the `SITE_URL` build argument to
the `frontend` service → `frontend/Dockerfile`'s `seo` stage passes it as `--site-url` to
`tools/seo/generate_seo.py`, alongside the production seed at
`database/prod-initdb.d/500_prod_seed.sql`.

`generate_seo.py` rewrites `index.html`'s `<head>` and writes `robots.txt`, `sitemap.xml` and
`og-image.png` into the built frontend — but only when **both**:

- `SITE_URL` resolves to a real host. It is lower-cased, has any `http(s)://` and `www.` prefix
  stripped, and is rejected if it is empty, contains whitespace, has no dot, or matches
  `example.com`/`example.org`/`example.net`/`yourdomain.com` (or any subdomain of one) — the
  values the templates ship with.
- The production seed at `database/prod-initdb.d/500_prod_seed.sql` exists, is readable, and its
  first user's name/email are not still the seed template's placeholders (`Your Name`,
  `Your Title`, an `@example.*` address).

If either check fails, `generate_seo.py` logs why (`seo: omitting the SEO artefacts — …`) and
exits `0` — the build still succeeds, it simply ships without a rewritten document head,
`robots.txt`, `sitemap.xml` or `og-image.png`. This only runs in the `frontend/Dockerfile`
production image; `npm run dev`/`npm run build` locally never invoke it. See
[deployment](./deployment.md) for creating a real production seed, and [seo](./seo.md) for what
the generator writes into the head.

## `.example` templates

| Template                                           | Copy to                                              | Safe to commit                         |
| -------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| `.env.example`                                     | `.env`                                               | Yes — contains only placeholder values |
| `.env.prod.example`                                | `.env`                                               | Yes                                    |
| `backend/.env.example`                             | `backend/.env`                                       | Yes                                    |
| `frontend/.env.example`                            | `frontend/.env.development` or `frontend/.env.local` | Yes                                    |
| `frontend/.env.production.example`                 | `frontend/.env.production`                           | Yes                                    |
| `frontend/mock/.env.example`                       | `frontend/mock/.env`                                 | Yes                                    |
| `database/prod-initdb.d/500_prod_seed.sql.example` | `database/prod-initdb.d/500_prod_seed.sql`           | Yes — the filled-in copy is gitignored |

Never commit a filled-in `.env`, `frontend/.env.production`, or
`database/prod-initdb.d/500_prod_seed.sql` — all three are excluded in `.gitignore`.
