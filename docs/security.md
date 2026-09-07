# Security

The security posture of the production deployment: what's exposed, what headers are sent and
why, what the API can and cannot do, and how secrets stay out of the repository. For the
deployment process itself, see [deployment](./deployment.md).

## Network exposure

Only `caddy` publishes ports to the host (`80`, `443`, `443/udp`). `mysql`, `backend` and
`frontend` all set `ports: !reset []` in `docker-compose.prod.yml` — they're reachable only from
other containers on the Docker network, never directly from outside the host. Every request,
whether for the site itself or `/api/*`, passes through Caddy, then nginx (`frontend`), which
proxies `/api/` on to `backend`.

## Response headers live in Caddy, not nginx

`Caddyfile.example` defines a `(hardening)` snippet, imported into every site block, that sets:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy` (see below)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- Removal of the `Server`, `Via` and `X-Powered-By` response headers, so neither Caddy's own
  version nor anything the nginx or Express upstreams add is disclosed.

These live in Caddy rather than in `frontend/nginx.conf` because nginx's `add_header` does not
inherit the way you'd expect: an `add_header` inside a `location` block discards every
`add_header` set in the enclosing `server` block, so any header set once at the top of
`frontend/nginx.conf` would silently vanish from whichever `location` blocks (`/api/`, `/assets/`,
`/robots.txt`, ...) declare their own. Setting the headers in Caddy instead means every response
gets them — static files nginx serves directly and `/api/*` responses nginx proxies from
`backend` alike — without having to keep them duplicated across every `location` block.

Caddy also handles compression (`encode zstd gzip`) for the same reason it's a single choke point
for every response. `frontend/nginx.conf` deliberately leaves `gzip` off: if nginx compressed a
response first, Caddy would receive an already-encoded body and reuse nginx's gzip encoding
instead of re-encoding with its own zstd.

## Content-Security-Policy

```
default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self';
connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none';
frame-ancestors 'none'; upgrade-insecure-requests
```

Every directive resolves to the site's own origin, or nothing. What this rules out, and would
need a CSP change to reintroduce:

- **Any third-party script or analytics tag.** `script-src 'self'` with no external hosts and no
  `'unsafe-inline'` means an inline `<script>` or a tag pointed at another origin is blocked
  outright, not just logged.
- **Third-party fonts.** `font-src 'self'` is why fonts are self-hosted under
  `frontend/public/fonts` rather than fetched from Google Fonts — pointing back at
  `fonts.googleapis.com`/`fonts.gstatic.com` would violate this directive.
- **Hotlinked or CDN-served images.** `img-src 'self'` blocks any `<img>` or CSS background not
  served from this origin.
- **Calls from the frontend to any API but this one.** `connect-src 'self'` covers `fetch`,
  `XMLHttpRequest` and WebSocket connections; a client-side call to a third-party API would need
  this loosened first.
- **Embedding this site in an iframe anywhere**, via `frame-ancestors 'none'` — reinforced by the
  separate `X-Frame-Options: DENY` header for browsers that only understand the older directive.
- **Any `<form>` submission**, via `form-action 'none'` — consistent with the API being read-only
  (below); nothing on this site submits a form today.
- **Plugin content** (Flash, Java applets, etc.), via `object-src 'none'`.

`style-src 'self'` carries no `'unsafe-inline'`, which would normally block React's inline
`style={{...}}` props — but it doesn't, because React sets those via the DOM node's `.style`
property rather than writing a literal `style="..."` HTML attribute, and CSP's `style-src` only
governs the attribute form. A UI library that injects `<style>` tags or literal `style="..."`
attributes at runtime (a CSS-in-JS library using the older stylesheet-injection approach, for
example) would violate this policy and need either a nonce/hash added to the CSP or
`'unsafe-inline'` reinstated.

## nginx: API caching and rate limiting

`frontend/nginx.conf`'s `/api/` location, which proxies to `backend`, adds two things nginx alone
can do (Caddy does not cache or rate-limit today):

- **Response caching.** `proxy_cache_path` defines a 100 MB cache (`/var/cache/nginx/api`),
  keyed on the full request URI, holding `200` responses for 5 minutes. `proxy_cache_lock on`
  means concurrent requests for an uncached key queue behind a single upstream call rather than
  each hitting `backend` directly. `proxy_cache_use_stale` serves a stale cached copy rather than
  an error if `backend` returns `5xx`, times out, or is mid-update. Since `proxy_cache` only
  caches `GET`/`HEAD` by default, this only ever applies to the read endpoints that exist today —
  a future write endpoint would not be cached without further configuration.
- **Rate limiting.** `limit_req_zone` tracks requests per client IP (`$binary_remote_addr`) at
  10 requests/second, applied to `/api/` with `burst=20 nodelay`. The real client IP is read from
  `X-Forwarded-For` (via `set_real_ip_from`/`real_ip_header`) rather than `$remote_addr`, since
  every request reaches `frontend` via the `caddy` container and `$remote_addr` would otherwise
  always be Caddy's own container IP — which would rate-limit everyone as a single client. The
  trusted subnet (`172.18.0.0/16`) is not pinned in `docker-compose.yml`, so it should be
  re-checked if the Docker network is ever recreated and assigned a different one.

`backend/src/index.ts` also applies `helmet()`, which adds a baseline set of security headers at
the Express layer itself. Since `backend` publishes no port to the host, this only matters for
requests made directly on the Docker network — every request a real client makes is already
covered by Caddy's hardening snippet by the time it reaches the browser.

## The database user is read-only

`database/prod-initdb.d/900_readonly_user.sh` runs once, on first initialisation of the `mysql`
container (see [operations](./operations.md#the-database-is-not-re-seeded-on-restart) for when
that is), and creates the app's database user with exactly one grant:

```sql
GRANT SELECT ON personal_website.* TO '${DB_READONLY_USER}'@'%';
```

`backend` connects with these credentials in production (`docker-compose.prod.yml` sets
`DB_USER: ${DB_READONLY_USER:-webapp}`, `DB_PASSWORD: ${DB_READONLY_PASSWORD}`), never with the
MySQL root account. `MYSQL_ROOT_PASSWORD` exists only to initialise the server and run the
migration/seed/user-creation scripts on first start — the running application never uses it.

## The public API is read-only by design

Every route the backend defines is a `GET`:

```
GET /api/users
GET /api/users/:id
GET /api/users/:id/profile
GET /api/jobs/user/:userId
GET /api/education/user/:userId
GET /api/projects/user/:userId
GET /api/skills/user/:userId
GET /api/achievements/user/:userId
GET /api/contact-info/:userId
GET /api/health
```

There is no `POST`, `PUT`, `PATCH` or `DELETE` route anywhere in `backend/src/routes/`. This is
reinforced, not just assumed: even if a write route were added without updating the database
grant, the read-only MySQL user would reject the write at the database layer. The CSP's
`form-action 'none'` (above) reflects the same fact from the frontend side — nothing on the site
submits data anywhere.

Error responses never leak internals: `backend/src/index.ts`'s error handler maps every sub-500
status to a fixed, generic message (`CLIENT_ERROR_MESSAGES`) and every 500 to
`"Internal server error"` — `err.message`, which can carry request input, file paths or
connection strings, is logged server-side (`console.error(err.stack)`) and never sent to the
client.

## Secrets stay out of the repository

`.gitignore` excludes every file that can hold a real credential or personal data:

- `.env`, `.env.local` — database passwords, `SITE_URL`, `ALLOWED_ORIGINS`
- `frontend/.env.production` — the production `VITE_APP_URL`
- `database/prod-initdb.d/500_prod_seed.sql` — the real name, contact details, employment and
  education history that seed the site
- `Caddyfile`, `docker-compose.host.yml` — the real domain names and any host-specific topology
- `frontend/public/images/*` (except the tracked `placeholder-profile.jpeg`) — the deployment
  owner's actual profile photo

Everything committed in their place is a `.example` template holding only placeholder values —
see [configuration](./configuration.md#example-templates) for the full list and what to copy each
one to. Because these files are gitignored rather than merely `.example`-suffixed, a `git pull` on
a live host never overwrites the real, running configuration with a template.
