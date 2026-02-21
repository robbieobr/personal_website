FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/

RUN npm install -w frontend

COPY frontend/ ./frontend/

RUN npm run build -w frontend

EXPOSE 3000

WORKDIR /app/frontend
CMD ["npm", "run", "preview"]
