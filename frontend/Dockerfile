# The SPA build, which is all the `frontend` service in docker-compose.yml runs
# (it targets this stage) and all the `seo` stage below takes as input.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm ci --workspace=frontend

COPY frontend/ ./frontend/

RUN npm run build -w frontend

WORKDIR /app/frontend

# The SEO artefacts, generated from the deployment's own files. Only the
# production image below is built from this stage, so a development build never
# runs it.
FROM python:3.13-slim AS seo

WORKDIR /srv

COPY tools/seo/requirements.txt ./tools/seo/requirements.txt
RUN pip install --no-cache-dir --requirement tools/seo/requirements.txt

COPY tools/ ./tools/
COPY --from=builder /app/frontend/build ./web

# The trailing wildcards also match the committed .example templates, so the
# copy succeeds on a checkout with no real Caddyfile or production seed and the
# generator writes nothing.
COPY Caddyfile* ./deployment/
COPY database/prod-initdb.d/500_prod_seed.sql* ./deployment/

RUN python -m tools.seo \
      --build-dir ./web \
      --caddyfile ./deployment/Caddyfile \
      --seed ./deployment/500_prod_seed.sql \
  && rm -rf ./deployment ./tools

FROM nginx:alpine AS production

COPY --from=seo /srv/web /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
