# Deployment

Deploying this repository to a fresh host, from an empty checkout to a serving site. For what
each variable does once it's in place, see [configuration](./configuration.md). For redeploying
an already-running host, see [operations](./operations.md).

## Prerequisites

- A Linux host with Docker Engine and Docker Compose v2.24 or newer — `docker-compose.prod.yml`
  uses the `!reset` YAML tag on several keys, which requires that version.
- DNS `A`/`AAAA` records for the domain(s) you're deploying, already pointed at the host. Caddy
  requests a TLS certificate for each domain named in the `Caddyfile` the first time it starts,
  and that fails if DNS isn't live yet.
- Ports 80 and 443 (TCP), and 443/udp (for HTTP/3), reachable from the internet.
- Node.js and npm are not required on the host — the frontend and backend both build inside
  Docker.

## Files to create from templates

Nothing below is tracked with real values — each is gitignored once filled in, so a `git pull` on
the host never overwrites live configuration.

| Create                                     | From                                               | Fill in                                                                                                      |
| ------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `.env`                                     | `.env.prod.example`                                | `MYSQL_ROOT_PASSWORD`, `DB_READONLY_USER`, `DB_READONLY_PASSWORD`, `ALLOWED_ORIGINS`, `SITE_URL`             |
| `frontend/.env.production`                 | `frontend/.env.production.example`                 | `VITE_APP_URL` (your public URL, with `https://`)                                                            |
| `database/prod-initdb.d/500_prod_seed.sql` | `database/prod-initdb.d/500_prod_seed.sql.example` | Your name, title, bio, contact details, job history, education and skills                                    |
| `Caddyfile`                                | `Caddyfile.example`                                | Your domain(s), replacing `example.com`/`www.example.com`                                                    |
| `docker-compose.host.yml` (optional)       | `docker-compose.host.yml.example`                  | Only if Caddy needs to reach a container outside this compose project — see the comments in the example file |

```bash
cp .env.prod.example .env
cp frontend/.env.production.example frontend/.env.production
cp database/prod-initdb.d/500_prod_seed.sql.example database/prod-initdb.d/500_prod_seed.sql
cp Caddyfile.example Caddyfile
```

Edit each of the four files before continuing. See [configuration](./configuration.md#site_url-and-the-seo-build)
for what happens if `SITE_URL` or the seed are left as placeholders — the build still succeeds,
it just omits the generated SEO artefacts.

## Bringing the stack up

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Add `-f docker-compose.host.yml` before `up` if you created that overlay:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.host.yml up -d --build
```

This builds four images and starts four containers: `caddy` (reverse proxy and TLS), `mysql`
(seeded from `database/prod-initdb.d/`, read-only user created by `900_readonly_user.sh`),
`backend` (compiled `dist/index.js`, connecting as the read-only user), and `frontend` (an nginx
image serving the Vite build, with the SEO artefacts baked in if `SITE_URL` and the seed were
real). None of `mysql`, `backend` or `frontend` publish a port to the host — see
[security](./security.md) for why. Only `caddy` binds 80/443.

## What Caddy provisions automatically

Caddy requests and renews Let's Encrypt certificates for every domain block in the `Caddyfile`
with no further configuration — no cron job, no certbot, no manual renewal. Certificates and
account state persist in the `caddy_data` volume, so they survive a container recreate; only
deleting that volume forces re-issuance. The hardening snippet's HSTS header includes `preload`,
but that directive alone does not add the domain to browsers' HSTS preload list — only submitting
it at hstspreload.org does, and that is very difficult to reverse. Do not submit until every
subdomain will permanently run HTTPS (see the comment in `Caddyfile.example`).

## Verifying the deployment

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

All four services should show as running/healthy. Then:

- `curl -I https://yourdomain.com/` returns `200`, with `strict-transport-security` and
  `content-security-policy` headers present (Caddy's hardening snippet — see
  [security](./security.md)).
- `curl https://yourdomain.com/api/health` returns `{"status":"ok"}` — this confirms the backend
  reached MySQL with the read-only credentials.
- If `SITE_URL` and the seed held real values: `curl https://yourdomain.com/robots.txt` and
  `/sitemap.xml` both return `200`, and `curl -s https://yourdomain.com/ | grep '<title>'` shows
  your real title rather than the template's placeholder.
- `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs caddy` shows the
  certificate was obtained, with no TLS errors.

See [operations](./operations.md) for the fuller smoke-test checklist to run after every deploy,
not just the first one.
