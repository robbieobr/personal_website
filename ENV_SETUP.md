# Environment Configuration Guide

This document explains the environment variables used throughout the Personal Website project.

## Overview

The project uses environment variables to manage configuration across different environments:
- **Development** - Local development setup
- **Mock** - Development with mock server (no backend required)
- **Docker** - Full-stack Docker deployment

## Quick Setup

### 1. Root Level (.env)

Create a `.env` file in the project root (optional for local development):

```bash
cp .env.example .env
```

This file contains variables for `docker compose` commands.

### 2. Backend (.env)

Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

**Default values for local development:**

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=personal_website
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5001,http://localhost:5000
```

### 3. Frontend (.env)

The frontend uses `.env` files from Vite. Choose one:

**Option A: Development (Real Backend)**

```bash
cp frontend/.env.example frontend/.env.development
```

**Option B: Mock Server Development**

```bash
cp frontend/.env.mock frontend/.env.local
```

**Option C: Production Build**

Create `frontend/.env.production` from the example and set your domain:

```bash
cp frontend/.env.production.example frontend/.env.production
# edit frontend/.env.production — set VITE_APP_URL to your real domain
```

This file is loaded automatically by `npm run build`.

### 4. Mock Server (.env)

(Optional) If you want to customize the mock server:

```bash
cp frontend/mock/.env.example frontend/mock/.env
```

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Default | Type |
|----------|-------------|---------|------|
| `DB_HOST` | MySQL database host | `localhost` | string |
| `DB_PORT` | MySQL database port | `3306` | number |
| `DB_USER` | MySQL username | `root` | string |
| `DB_PASSWORD` | MySQL password | `rootpassword` | string |
| `DB_NAME` | Database name | `personal_website` | string |
| `PORT` | Backend server port | `5000` | number |
| `NODE_ENV` | Environment mode | `development` | string |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:3000,http://localhost:5001,http://localhost:5000` | string |

**Example Backend .env:**

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=personal_website
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5001,http://localhost:5000
```

### Frontend Environment Variables

| Variable | Description | Default | Type |
|----------|-------------|---------|------|
| `VITE_API_BACKEND` | Backend API server URL | `http://localhost:5000` | URL |
| `VITE_API_URL` | Full API endpoint URL | `http://localhost:5000/api` | URL |
| `VITE_APP_URL` | Public site URL — shown as header link text in production builds | *(unset in dev)* | URL |

**Development (.env.development):**

```env
VITE_API_BACKEND=http://localhost:5000
VITE_API_URL=http://localhost:5000/api
```

**Mock Server (.env.mock):**

```env
VITE_API_BACKEND=http://localhost:5001
VITE_API_URL=http://localhost:5001/api
```

### Docker Environment Variables

Used by `docker-compose.yml`:

| Variable | Description | Default | Type |
|----------|-------------|---------|------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password | `rootpassword` | string |
| `MYSQL_DATABASE` | Database name | `personal_website` | string |
| `DB_PASSWORD` | Backend database password | `rootpassword` | string |
| `ALLOWED_ORIGINS` | Backend CORS origins | `http://localhost:3000,http://localhost:5001,http://backend:5000` | string |
| `VITE_API_BACKEND` | Frontend API backend URL | `http://backend:5000` | URL |
| `VITE_API_URL` | Frontend direct API URL | `http://localhost:5000/api` | URL |

Additional variables required by the production overlay (`docker-compose.prod.yml`):

| Variable | Description | Type |
|----------|-------------|------|
| `DB_READONLY_USER` | MySQL username for the backend in production | string |
| `DB_READONLY_PASSWORD` | Password for the read-only MySQL user | string |

**Example for Docker:**

```bash
docker compose up \
  -e MYSQL_ROOT_PASSWORD=secretpassword \
  -e DB_PASSWORD=secretpassword
```

### Mock Server Environment Variables

| Variable | Description | Default | Type |
|----------|-------------|---------|------|
| `MOCK_PORT` | Mock server port | `5001` | number |
| `MOCK_NETWORK_DELAY` | Simulated network delay in ms | `1000` | number |
| `MOCK_ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:3000,http://localhost:5001,http://localhost:5000` | string |

**Example Mock Server .env:**

```env
MOCK_PORT=5001
MOCK_NETWORK_DELAY=1000
MOCK_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5001,http://localhost:5000
```

## Development Workflows

### Workflow 1: Full Stack with Docker

Uses Docker for everything (MySQL, Backend, Frontend):

```bash
docker compose up
```

**Environment:** Uses variables from root `.env` file

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api
- MySQL: localhost:3306

### Workflow 2: Backend + Mock Frontend

Real backend with Vite dev server (hot reload):

```bash
# Terminal 1: Start backend
cd backend
npm install
npm run dev

# Terminal 2: Start frontend
cd frontend
npm install
npm run dev
```

**Environment Variables:**
- Backend: `backend/.env` (DB_HOST=localhost)
- Frontend: `frontend/.env.development`

**Access:**
- Frontend: http://localhost:3000 (hot reload)
- Backend: http://localhost:5000/api
- MySQL: localhost:3306

### Workflow 3: Frontend Only with Mock Server

Vite dev server with mock backend (no real database):

```bash
# Terminal 1: Start mock server
cd frontend
npm install
npm run mock

# Terminal 2: Start frontend
npm run dev:mock
```

**Environment Variables:**
- Frontend: `frontend/.env.mock`
- Mock Server: `frontend/mock/.env` (optional)

**Access:**
- Frontend: http://localhost:3000 (hot reload)
- Mock API: http://localhost:5001/api
- No database required

## Security Notes

⚠️ **Important for Production:**

1. **Never commit `.env` files** - They should be in `.gitignore`
2. **Use strong passwords** in production (don't use defaults)
3. **Restrict CORS origins** to your actual domain
4. **Set NODE_ENV=production** for backend
5. **Use environment-specific variables** (dev, staging, production)

### Production Setup

Production uses a dedicated Docker Compose overlay (`docker-compose.prod.yml`) with a root-level `.env` file. Copy the template and fill in real values:

```bash
cp .env.prod.example .env
# edit .env with strong passwords and your actual domain
```

**`.env` (Production — from `.env.prod.example`):**

```env
MYSQL_ROOT_PASSWORD=<strong_password>
DB_READONLY_USER=webapp
DB_READONLY_PASSWORD=<strong_password>
DB_HOST=mysql
DB_PORT=3306
DB_NAME=personal_website
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
```

**Frontend production environment (`frontend/.env.production`):**

```env
VITE_API_BACKEND=http://backend:5000
VITE_APP_URL=https://yourdomain.com
```

Create this from `frontend/.env.production.example` before running a production build.

Then deploy:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

See `TODO.md` for the full pre-deployment checklist.

## Troubleshooting

### Port Already in Use

If a port is already in use, set a different one:

```env
# Backend
PORT=5001

# Frontend (vite.config.ts already supports this)
# Frontend runs on next available port automatically

# Mock server
MOCK_PORT=5002
```

### Cannot Connect to Database

Check your backend `.env`:

```bash
# Verify database is running
docker ps | grep mysql

# Check connection string
cat backend/.env

# Test connection
mysql -h localhost -u root -p personal_website
```

### CORS Errors

Ensure `ALLOWED_ORIGINS` includes your frontend:

```env
# In backend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5001,http://your-domain.com
```

### API Endpoints Not Found

Verify `VITE_API_BACKEND` points to the correct server:

```bash
# Test API directly
curl http://localhost:5000/api/health
```

## Migration from Hardcoded to Environment Variables

All hardcoded URLs and credentials have been extracted:

### Database Credentials
- ✅ Moved from inline config to `.env` files
- ✅ Docker-compose uses `${DB_PASSWORD:-default}` syntax

### API Endpoints
- ✅ Frontend: Uses `VITE_API_BACKEND` from environment
- ✅ Vite config: Uses `process.env.VITE_API_BACKEND`
- ✅ Mock server: Configurable via `MOCK_PORT`

### CORS Origins
- ✅ Backend: Now uses `ALLOWED_ORIGINS` environment variable
- ✅ Mock server: Now uses `MOCK_ALLOWED_ORIGINS` environment variable

## Additional Resources

- [Backend README](./backend/README.md) - Backend documentation
- [Frontend README](./frontend/README.md) - Frontend documentation
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
