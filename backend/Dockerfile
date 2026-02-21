FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm ci --workspace=backend --include-workspace-root

COPY backend/ ./backend/

RUN npm run build -w backend

WORKDIR /app/backend

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm ci --workspace=backend --omit=dev

COPY --from=builder /app/backend/dist ./backend/dist

EXPOSE 5000

WORKDIR /app/backend
CMD ["node", "dist/index.js"]
