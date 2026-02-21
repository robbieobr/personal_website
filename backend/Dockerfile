FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm ci

COPY backend/ ./backend/

RUN npm run build -w backend

EXPOSE 5000

WORKDIR /app/backend
CMD ["npm", "start"]
