FROM node:20-alpine AS builder

WORKDIR /app

# Fonts for the text drawn into the generated social card.
RUN apk add --no-cache fontconfig ttf-dejavu

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm ci --workspace=frontend

COPY frontend/ ./frontend/

# Deployment-provided sources for the SEO artefacts. The trailing wildcards also
# match the committed .example templates, so the copy succeeds on a checkout that
# has no real Caddyfile or production seed and the build omits the artefacts.
COPY Caddyfile* ./
COPY database/prod-initdb.d/500_prod_seed.sql* ./database/prod-initdb.d/

RUN npm run build -w frontend && rm -rf ./database ./Caddyfile ./Caddyfile.example

WORKDIR /app/frontend

FROM nginx:alpine AS production

COPY --from=builder /app/frontend/build /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
