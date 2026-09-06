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

# The SEO artefacts, generated from the deployment's own domain and seed. Only
# the production image below is built from this stage, so a development build
# never runs it.
FROM python:3.13-slim AS seo

WORKDIR /srv

COPY tools/seo/requirements.txt ./
RUN pip install --no-cache-dir --requirement requirements.txt

COPY tools/seo/generate_seo.py tools/seo/og_image.py ./
COPY --from=builder /app/frontend/build ./web

# The trailing wildcard also matches the committed .example template, so the
# copy succeeds on a checkout with no production seed of its own.
COPY database/prod-initdb.d/500_prod_seed.sql* ./deployment/

# Canonical domain of the deployment, passed by docker-compose.prod.yml from
# SITE_URL in the root .env. Unset or still a placeholder, the generator writes
# nothing and the build carries on.
ARG SITE_URL=""

RUN python generate_seo.py \
      --build-dir ./web \
      --site-url "$SITE_URL" \
      --seed ./deployment/500_prod_seed.sql \
  && rm -rf ./deployment ./*.py ./requirements.txt

FROM nginx:alpine AS production

COPY --from=seo /srv/web /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
