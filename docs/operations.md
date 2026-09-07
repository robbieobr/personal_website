# Operations

The runbook for a site that is already deployed: redeploying a change, what a rebuild touches
and what it leaves alone, logs, health checks, and rolling back. For the first deployment to a
host, see [deployment](./deployment.md).

## Routine redeploy

Run from the repository root, on the host, with the working tree clean:

1. **Pre-flight.** Confirm you're on the branch you mean to deploy (`git status --porcelain`
   should be empty for tracked files — the untracked, gitignored deployment files like `.env`,
   `Caddyfile` and `frontend/.env.production` are expected to be present and are left alone).
   Confirm `.env`, `frontend/.env.production`, `Caddyfile` (and `docker-compose.host.yml` if you
   use one) all still exist — a deploy with any of them missing fails or serves the wrong config.
2. **Baseline check.** Before changing anything, confirm the site is currently healthy: the
   apex URL and `/api/*` both respond, and the response headers and cache behaviour described in
   [security](./security.md) are present. Deploying on top of an already-broken site makes the
   next failure hard to attribute.
3. **Snapshot for rollback.** Note the image ID currently backing the running `frontend` and
   `backend` containers (`docker inspect personal_website_frontend --format '{{.Image}}'`, same
   for `_backend`) and tag them locally before rebuilding, so the exact images in front of users
   right now are still retrievable by tag even after a new build replaces them. Also copy the
   current `Caddyfile` aside if you're about to change it.
4. **Build.** `docker compose -f docker-compose.yml -f docker-compose.prod.yml build --pull`
   builds new images without touching the running containers — a build failure costs nothing.
   `--pull` refreshes the `node:24-alpine` and `nginx:alpine` base images; it does not pull
   `mysql:8.0` or `caddy:2-alpine`, since neither has a `build:` section, so neither is upgraded
   by a redeploy.
5. **Recreate.** `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate --remove-orphans`
   swaps the running containers for the new images. This causes a brief interruption — Caddy
   drops its upstream connection to `frontend`/`backend` for the few seconds it takes the new
   containers to start and pass their health checks. If you changed the `Caddyfile`, recreate
   `caddy` too rather than trying to reload it in place — see [Caddyfile edits](#caddyfile-edits-need-a-recreate-not-a-reload) below.
6. **Verify.** Re-run the checks from [Health checks](#health-checks) below. If any fail, see
   [Rollback](#rollback).

## What a rebuild does and does not recreate

| Rebuilding... | Recreates                                                                                                                               | Leaves untouched                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `frontend`    | The nginx image: the Vite build output, SEO artefacts (if `SITE_URL` and the seed are real), `frontend/nginx.conf` baked into the image | Nothing it owns is persistent — a redeploy always ships the latest build |
| `backend`     | The compiled `dist/` output, `node_modules` (production-only, reinstalled from `package-lock.json`)                                     | The database it connects to                                              |
| `mysql`       | Not rebuilt by a normal redeploy — no `build:` section                                                                                  | `mysql_data` volume (all rows), and therefore anything already seeded    |
| `caddy`       | Not rebuilt — pulled from `caddy:2-alpine`, only refreshed by `--pull` on an image tag bump                                             | `caddy_data`/`caddy_config` volumes (TLS certificates, autosave state)   |

The one persistent thing a redeploy can touch is the `Caddyfile`, and only because it's a
bind-mount, not baked into an image — see below.

## The database is not re-seeded on restart

`docker-entrypoint-initdb.d` scripts — the migrations and `900_readonly_user.sh` in
`database/prod-initdb.d/` — are a MySQL entrypoint feature: the official `mysql` image only runs
them the first time it starts against an **empty** data directory. `docker-compose.prod.yml`
mounts `mysql_data` at `/var/lib/mysql`, so once that volume has been initialised once, every
subsequent `up`, restart, or `--force-recreate` skips `docker-entrypoint-initdb.d` entirely — the
migrations and seed do not run again, and edits to `database/prod-initdb.d/*.sql` after the first
run have no effect until the volume is deleted. There is no in-place migration runner in this
project: a schema change on a live database is a manual `ALTER TABLE` (or an equivalent one-off
script), not a redeploy.

## Caddyfile edits need a recreate, not a reload

The `Caddyfile` is bind-mounted read-only into the `caddy` container. A bind mount binds the
file's inode, not its path — if you replace the file (as `cp` does) rather than edit it in place,
the running container keeps reading the old inode until the container is recreated. `caddy
reload` inside the container re-reads whatever inode the mount currently points at, which after a
`cp` is still the old one — it looks like it worked and doesn't. Use
`docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate caddy`
(or recreate everything, per the redeploy steps above) after any `Caddyfile` change.

## Logs

Every production service logs to Docker's `json-file` driver, capped in `docker-compose.prod.yml`
(`x-logging`) at 10 MB per file, 3 files per container — roughly 30 MB retained per service before
Docker rotates the oldest out. This is set in the compose file rather than the Docker daemon
config so the limit travels with the repo and applies wherever it's deployed, rather than needing
a matching daemon setting on every host.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f caddy
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail 200 frontend
```

`backend`'s error handler (`backend/src/index.ts`) logs the full stack server-side on every 4xx/5xx
it catches, while the client only ever receives a generic message — the stack trace, not the
generic response, is what to check in `backend` logs when the API misbehaves.

## Health checks

- `GET /api/health` — the backend's own check; it runs `SELECT 1` against MySQL and returns `503`
  if that fails, so a `200` here confirms both the backend process and its database connection.
- `GET /` returns `200` with the expected `<title>`, and the response carries
  `strict-transport-security`, `content-security-policy`, `x-content-type-options: nosniff`,
  `x-frame-options: DENY` and `referrer-policy` — Caddy's hardening snippet (see
  [security](./security.md)).
- A request to a path that doesn't exist returns a real `404`, not `index.html` — this app has no
  client-side router, so `frontend/nginx.conf` disables the SPA fallback deliberately.
- Static, hashed assets under `/assets/` carry `Cache-Control: public, max-age=31536000, immutable`;
  `index.html` carries `no-cache`. A stale `index.html` pointing at asset filenames from a
  previous build is the usual symptom if this is inverted.
- If `SITE_URL` and the production seed hold real values: `/robots.txt` and `/sitemap.xml` both
  return `200` with the correct content types, and the response body of `/` contains the real
  `<title>`, an `og:image` tag, a `rel="canonical"` link and a `application/ld+json` block. If any
  of these are missing on a deploy where you expected them, the build likely treated `SITE_URL` or
  the seed as a placeholder — see [configuration](./configuration.md#site_url-and-the-seo-build).
- Response headers include `content-encoding` for both the HTML document and JS bundles — Caddy's
  `encode zstd gzip` (see [security](./security.md) for why compression happens there and not in
  nginx).
- The `Server` header does not read `nginx/…` or otherwise disclose a version — `server_tokens
off;` in `frontend/nginx.conf`, plus Caddy stripping `Server`/`Via`/`X-Powered-By` from every
  response it proxies.

## Rollback

1. Recreate the containers from the images tagged during the pre-deploy snapshot, and restore the
   `Caddyfile` copy taken at the same time (only needed if you changed it).
2. `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate`.
3. Re-run the [Health checks](#health-checks) above — treat a rollback as a deploy, not a
   presumed fix, and confirm it before considering the incident closed.

If the snapshot step was skipped or the tagged images have since been pruned from the local image
store, there is no fast path back — rebuild from the last known-good commit
(`git checkout <commit>`, then repeat the [routine redeploy](#routine-redeploy) build and recreate
steps) instead.

Because the database is never re-seeded by a redeploy or a rollback, rolling back application
images never rolls back data — a rollback only ever affects `frontend` and `backend` and,
optionally, the `Caddyfile`.
