# Production Deployment TODOs

- [ ] Copy `.env.prod.example` → `.env` and fill in strong passwords + your domain
- [ ] Edit `Caddyfile` — replace `yourdomain.com` with your actual domain
- [ ] Copy `database/prod-initdb.d/500_prod_seed.sql.example` → `database/prod-initdb.d/500_prod_seed.sql` and fill in your real data (this file is gitignored — never commit it)
- [ ] Verify Docker Compose v2.24+ on the server (`docker compose version`) for `!reset` support
- [ ] Run: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
