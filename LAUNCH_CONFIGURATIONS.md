# Launch Configurations

This document describes all available ways to launch the personal website project.

## 🚀 Quick Reference

| Configuration | Command | Use Case | Database Seed |
|---|---|---|---|
| **Default** | `docker-compose up -d` | General development | Default (1 user) |
| **Minimal** | `docker-compose -f docker-compose.yml -f docker-compose.minimal.yml up -d` | UI testing with minimal data | Minimal (1 user) |
| **Full** | `docker-compose -f docker-compose.yml -f docker-compose.full.yml up -d` | Comprehensive testing | Full (3 users) |
| **Frontend Only** | `cd frontend && npm run dev` | Frontend development | N/A |
| **Backend Only** | `cd backend && npm run dev` | Backend API development | Requires MySQL |
| **Mock Frontend** | `cd frontend && npm run mock` | Frontend with mock data | Mock data file |

## 📋 Configuration Details

### 1. Full Stack with Default Seed (Recommended)

**Best for:** General development, testing features

```bash
docker-compose up -d
```

**What starts:**
- MySQL container with default seed (1 user: John Doe)
- Backend API on port 5000
- Frontend on port 3000

**Database includes:**
- 1 user (John Doe - Full Stack Developer)
- 3 job history entries
- 2 education records

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- MySQL: localhost:3306

**Stop:**
```bash
docker-compose down
```

---

### 2. Full Stack with Minimal Seed

**Best for:** Testing UI with minimal data, edge cases

```bash
docker-compose -f docker-compose.yml -f docker-compose.minimal.yml up -d
```

**What starts:**
- MySQL container with minimal seed
- Backend API on port 5000
- Frontend on port 3000

**Database includes:**
- 1 user (Jane Smith - Software Engineer)
- No job history
- No education records

**Use case examples:**
- Test UI when user has no jobs
- Test empty state handling
- Test with minimal data
- Performance testing with small dataset

**Stop:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.minimal.yml down
```

---

### 3. Full Stack with Full Seed

**Best for:** Comprehensive testing, demo, extensive data testing

```bash
docker-compose -f docker-compose.yml -f docker-compose.full.yml up -d
```

**What starts:**
- MySQL container with full seed
- Backend API on port 5000
- Frontend on port 3000

**Database includes:**
- 3 users:
  - John Doe (Full Stack Developer)
  - Jane Smith (DevOps Engineer)
  - Alice Johnson (Product Manager)
- 7 job history entries
- 6 education records

**Use case examples:**
- Full feature demo
- Comprehensive testing
- Test scrolling with lots of data
- Test filtering/sorting features
- Load testing with realistic data

**Stop:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.full.yml down
```

---

### 4. Frontend Only Development

**Best for:** Frontend component development, styling

```bash
cd frontend
npm install  # First time only
npm run dev
```

**What starts:**
- Vite development server on port 5173
- Hot module reloading enabled
- Mock API data (if backend not running)

**Access:**
- Frontend: http://localhost:5173

**Advantages:**
- Fast development with hot reload
- Can develop without database setup
- Smaller resource footprint

**Stop:**
```bash
Ctrl+C in terminal
```

---

### 5. Backend Only Development

**Best for:** API development, testing routes

```bash
cd backend
npm install  # First time only
npm run dev
```

**Prerequisites:**
- MySQL running (see instructions below)
- Database initialized with seed data

**What starts:**
- Node.js Express server on port 5000
- Auto-reload on file changes (nodemon)

**Access:**
- API: http://localhost:5000/api
- Database: localhost:3306

**Test API endpoints:**
```bash
curl http://localhost:5000/api/users
curl http://localhost:5000/api/users/1
curl http://localhost:5000/api/jobs
curl http://localhost:5000/api/education
```

**Setup MySQL for local backend development:**
```bash
# Option 1: Docker
docker run -d \
  --name mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=personal_website \
  -p 3306:3306 \
  mysql:8.0

# Initialize database
cd ../database/scripts
./init.sh default

# Option 2: Local MySQL (if installed)
# Ensure MySQL is running and configured
```

**Stop:**
```bash
Ctrl+C in terminal
```

---

### 6. Frontend with Mock Server

**Best for:** Frontend development without backend, prototyping

```bash
cd frontend
npm install  # First time only
npm run mock
```

**What starts:**
- Mock server on port 3001
- Frontend connects to mock data
- Mock data from `frontend/mock/mockUserProfile.json`

**Access:**
- Frontend: http://localhost:3000 (if running together with npm run dev)
- Mock API: http://localhost:5001

**Advantages:**
- No backend or database needed
- Fast isolated development
- Test with known data

**Includes mock data:**
- Sample user profile
- Job history
- Education records

**Stop:**
```bash
Ctrl+C in terminal
```

---

## 🔄 Switching Between Configurations

### Reset Database for New Configuration

When switching between seed configurations, you may need to reset the database:

```bash
cd database/scripts
./reset.sh
```

This will:
1. Stop all Docker containers
2. Remove MySQL volume
3. Clear initialization files

Then reinitialize with desired seed:
```bash
./init.sh [seed_type]  # seed_type: default, minimal, or full
docker-compose up -d
```

### Clean Docker System

To remove all containers and volumes (complete cleanup):

```bash
docker-compose down -v
docker system prune -a --volumes
```

---

## 🔍 Viewing Logs

### All Services
```bash
docker-compose logs -f
```

### Specific Service
```bash
# Frontend
docker-compose logs -f frontend

# Backend
docker-compose logs -f backend

# MySQL
docker-compose logs -f mysql
```

### Follow live logs
```bash
docker-compose logs -f --tail=50
```

---

## 📊 System Resource Requirements

| Configuration | CPU | RAM | Disk |
|---|---|---|---|
| Backend Only | Low | 256MB | 100MB |
| Frontend Only | Low | 256MB | 500MB |
| Full Stack (Default) | Medium | 1GB | 1GB |
| Full Stack (Full Seed) | Medium | 1GB | 1GB |
| All running locally | High | 2GB+ | 2GB+ |

---

## ☁️ Port Mapping

| Service | Default Port | Can be changed | Config file |
|---|---|---|---|
| Frontend | 3000 | Yes | `docker-compose.yml` |
| Backend API | 5000 | Yes | `docker-compose.yml` |
| MySQL | 3306 | Yes | `docker-compose.yml` |
| Vite Dev (local) | 5173 | Yes | `frontend/vite.config.ts` |
| Mock Server | 5001 | Yes | `frontend/mock/mockServer.js` |

### Change Port Example

Edit `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Changed from 3000 to 3001
```

---

## 🐛 Troubleshooting by Configuration

### Docker Compose Issues

**Containers won't start:**
```bash
docker-compose logs
docker-compose down
docker-compose up -d --build
```

**Port already in use:**
```bash
# Find process on port
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :3306  # MySQL

# Kill process
kill -9 <PID>
```

**Database not initialized:**
```bash
cd database/scripts
./reset.sh
./init.sh default
docker-compose up -d
```

### Local Development Issues

**Can't connect to API from frontend:**
```bash
# Check API is running
curl http://localhost:5000/api/users

# Check logs
# In backend terminal: view error output
# In frontend: check browser console
```

**Module not found errors:**
```bash
# Reinstall packages
cd frontend  # or backend
rm -rf node_modules
npm install
```

**TypeScript compilation errors:**
```bash
# Rebuild
npm run build

# Or check tsconfig.json settings
```

---

## 🔐 Environment Variables

### Docker (auto-configured)
All environment variables are set in `docker-compose.yml`:
```yaml
environment:
  DB_HOST: mysql
  DB_PORT: 3306
  DB_USER: root
  DB_PASSWORD: rootpassword
  DB_NAME: personal_website
  PORT: 5000
  NODE_ENV: development
```

### Local Development
Create `.env` in `backend/` directory:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=personal_website
PORT=5000
NODE_ENV=development
```

---

## 📈 Scaling for Production

For production deployment, consider:

1. **Use environment-specific Dockerfiles**
2. **Multi-stage builds for smaller images**
3. **Health checks on all services**
4. **Persistent volumes for database**
5. **Resource limits per container**
6. **Logging and monitoring setup**
7. **SSL/TLS certificate configuration**
8. **Database backups and recovery plan**

---

## 🔗 Related Documentation

- [Main README](README.md) - Project overview
- [Frontend README](frontend/README.md) - Frontend details
- [Backend README](backend/README.md) - Backend details
- [Database README](database/README.md) - Database setup
- [Database Schema](database/SCHEMA.md) - Data structure

---

## 📝 Quick Command Reference

```bash
# Start services
docker-compose up -d
docker-compose -f docker-compose.yml -f docker-compose.minimal.yml up -d
docker-compose -f docker-compose.yml -f docker-compose.full.yml up -d

# Stop services
docker-compose down
docker-compose down -v  # With volume cleanup

# View status
docker-compose ps
docker-compose logs -f

# Database operations
cd database/scripts
./init.sh [seed_type]
./reset.sh

# Frontend development
cd frontend
npm install
npm run dev
npm run mock

# Backend development
cd backend
npm install
npm run dev

# Docker commands
docker ps
docker logs <container-name>
docker exec -it <container-name> bash
```

---

## 🎯 Common Workflows

### Workflow 1: Full Feature Development
```bash
# Terminal 1: Start full stack
docker-compose up -d

# Terminal 2: Frontend development
cd frontend
npm run dev

# Make changes to frontend, hot reload works
```

### Workflow 2: Backend API Development
```bash
# Terminal 1: Start MySQL and frontend mock
docker-compose up -d mysql
cd frontend
npm run mock

# Terminal 2: Backend development
cd backend
npm run dev

# Make changes to API, test with mock frontend
```

### Workflow 3: Database Schema Changes
```bash
# Create new migration file
vi database/migrations/005_new_table.sql

# Reset database
cd database/scripts
./reset.sh
./init.sh default

# Restart containers
docker-compose up -d
```

### Workflow 4: Testing UI Variations
```bash
# Test with minimal data
docker-compose -f docker-compose.yml -f docker-compose.minimal.yml up -d
# Make UI adjustments...

# Reset and test with full data
cd database/scripts
./reset.sh
./init.sh full
docker-compose up -d
# Verify with more data...
```
