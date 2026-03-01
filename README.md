# Personal Website

A full-stack web application showcasing a professional profile, job history, and educational background. This project serves as both a demo application and a living CV/resume.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Running with Different Configurations](#running-with-different-configurations)
- [Database Configuration](#database-configuration)
- [Development](#development)
- [Docker Services](#docker-services)
- [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

This is a full-stack application built with:
- **Frontend:** React with TypeScript
- **Backend:** Node.js/Express with TypeScript
- **Database:** MySQL 8.0
- **Deployment:** Docker & Docker Compose

The application displays:
- User profile information
- Job history with descriptions and dates
- Educational background
- Professional links and contact information

## 🛠 Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Modern build tool and dev server
- **Axios** - HTTP client for API communication
- **i18n** - Internationalization support
- **CSS** - Styling

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MySQL** - Database driver

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📁 Project Structure

```
personal_website/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── App.tsx          # Main application component
│   │   ├── index.tsx        # Entry point
│   │   ├── components/      # Reusable React components
│   │   │   ├── UserProfile.tsx
│   │   │   ├── JobHistory.tsx
│   │   │   └── EducationHistory.tsx
│   │   ├── pages/           # Page components
│   │   │   └── ProfilePage.tsx
│   │   ├── services/        # API client services
│   │   │   └── api.ts
│   │   ├── i18n/            # Internationalization
│   │   │   ├── config.ts
│   │   │   └── locales/
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets
│   ├── mock/                # Mock server for development
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                 # Node.js Express backend
│   ├── src/
│   │   ├── index.ts         # Application entry point
│   │   ├── config/          # Configuration
│   │   │   └── database.ts
│   │   ├── controllers/     # Request handlers
│   │   │   ├── userController.ts
│   │   │   ├── contactInfoController.ts
│   │   │   ├── jobController.ts
│   │   │   ├── educationController.ts
│   │   │   ├── projectController.ts
│   │   │   ├── skillController.ts
│   │   │   └── achievementController.ts
│   │   ├── routes/          # Route definitions
│   │   │   ├── userRoutes.ts
│   │   │   ├── contactInfoRoutes.ts
│   │   │   ├── jobRoutes.ts
│   │   │   ├── educationRoutes.ts
│   │   │   ├── projectRoutes.ts
│   │   │   ├── skillRoutes.ts
│   │   │   └── achievementRoutes.ts
│   │   ├── models/          # Data models
│   │   └── types/           # TypeScript type definitions
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── database/                # Database schema and seeds
│   ├── migrations/          # Table definitions (001–009)
│   │   ├── 001_create_database.sql
│   │   ├── 002_create_users_table.sql
│   │   ├── 003_create_job_history_table.sql
│   │   ├── 004_create_education_table.sql
│   │   ├── 005_create_projects_table.sql
│   │   ├── 006_create_skills_table.sql
│   │   ├── 007_create_achievements_table.sql
│   │   ├── 008_create_contact_info_table.sql
│   │   └── 009_remove_contact_from_users.sql
│   ├── seeds/               # Test data
│   │   ├── default/         # Default seed (1 user)
│   │   ├── minimal/         # Minimal seed (1 user, no history)
│   │   └── full/            # Full seed (3 users, extended history)
│   ├── scripts/             # Database utilities
│   │   ├── init.sh          # Initialize database
│   │   └── reset.sh         # Reset database
│   ├── docker-entrypoint-initdb.d/  # Docker init files (default seed)
│   ├── prod-initdb.d/       # Production Docker init files (migrations + prod seed + readonly user)
│   ├── init/                # Pre-combined init directories for compose overrides
│   │   ├── minimal/         # Migrations + minimal seed
│   │   └── full/            # Migrations + full seed
│
├── docker-compose.yml       # Main container orchestration
├── docker-compose.minimal.yml    # Minimal seed configuration
├── docker-compose.full.yml       # Full seed configuration
├── .gitignore
├── LICENSE
└── README.md                # This file
```

## 📋 Prerequisites

Before running this project, ensure you have:

- **Docker** (v20.10+) - [Download](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (v2.0+) - Usually included with Docker Desktop
- **Node.js** (v20+) - Required for local development without Docker
- **npm** (v10.0.0+) - Package manager

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Clone and navigate to the project:**
   ```bash
   cd personal_website
   ```

2. **Start all services with default configuration:**
   ```bash
   docker compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - MySQL: localhost:3306

4. **View logs:**
   ```bash
   docker compose logs -f
   ```

5. **Stop services:**
   ```bash
   docker compose down
   ```

### Local Development (Without Docker)

1. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Access at http://localhost:5173

2. **Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Server runs on http://localhost:5000

3. **Database:**
   - Install MySQL locally or use Docker just for MySQL:
     ```bash
     docker run -d \
       --name mysql \
       -e MYSQL_ROOT_PASSWORD=rootpassword \
       -e MYSQL_DATABASE=personal_website \
       -p 3306:3306 \
       mysql:8.0
     ```

## 🎯 Running with Different Configurations

### Configuration 1: Default Seed (Recommended for general use)

The default configuration includes 1 user with 3 job positions and 2 education records.

```bash
docker compose up -d
```

**Services:**
- Frontend on port 3000
- Backend API on port 5000
- MySQL with default seed data

### Configuration 2: Minimal Seed (For UI testing with minimal data)

Useful for testing with only 1 user and no job/education history.

```bash
docker compose -f docker-compose.yml -f docker-compose.minimal.yml up -d
```

**database/seeds/minimal/** contains:
- 1 user: Jane Smith (Software Engineer)
- No job history
- No education records

### Configuration 3: Full Seed (For comprehensive testing)

Extended dataset with 3 users with complete professional history.

```bash
docker compose -f docker-compose.yml -f docker-compose.full.yml up -d
```

**database/seeds/full/** contains:
- 3 users:
  - John Doe (Full Stack Developer)
  - Jane Smith (DevOps Engineer)
  - Alice Johnson (Product Manager)
- 7 job history entries
- 6 education records

## 🗄️ Database Configuration

### Database Structure

The database consists of seven tables:

- **users** - User profile information (name, title, bio, profile image)
- **contact_info** - Contact details per user (email, phone, website, GitHub, LinkedIn)
- **job_history** - Employment history records
- **education** - Educational background records
- **projects** - Project portfolio entries
- **skills** - Skill list entries
- **achievements** - Career achievement records

For detailed schema documentation, see [database/SCHEMA.md](database/SCHEMA.md).

### Managing Database Seeds

#### Initialize with Different Seed Types

The database can be reinitialized with different seed datasets using the init script:

```bash
# Initialize with default seed
cd database/scripts
./init.sh default
docker compose up -d

# Initialize with minimal seed
./init.sh minimal
docker compose up -d

# Initialize with full seed
./init.sh full
docker compose up -d
```

#### Reset Database to Clean State

To completely reset the database and start fresh:

```bash
cd database/scripts
./reset.sh
```

This will:
1. Stop all containers
2. Remove the MySQL data volume
3. Clear initialization files

Then reinitialize with desired seed:
```bash
./init.sh [seed_type]
docker compose up -d
```

### Adding Custom Seeds

To create a new seed dataset:

1. Create a directory under `database/seeds/`:
   ```bash
   mkdir -p database/seeds/custom
   ```

2. Create SQL files for each table:
   ```bash
   database/seeds/custom/001_users.sql
   database/seeds/custom/002_job_history.sql
   database/seeds/custom/003_education.sql
   ```

3. Initialize:
   ```bash
   cd database/scripts
   ./init.sh custom
   docker compose up -d
   ```

## 💻 Development

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on http://localhost:5173 with hot module reloading via Vite.

#### Available Scripts:
- `npm run dev` - Start development server on port 5173 (uses real backend at localhost:5000)
- `npm run dev:mock` - Start dev server on port 5173, proxying /api to mock server at localhost:5001
- `npm run mock` - Start mock API server on port 5001 (run alongside `dev:mock`)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Backend Development

```bash
cd backend
npm install
npm run dev
```

The backend API will start on http://localhost:5000.

#### Available Scripts:
- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Run compiled JavaScript

#### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=personal_website
PORT=5000
NODE_ENV=development
```

In Docker, these are automatically configured via `docker-compose.yml`.

### Database Development

Database migrations and seeds are in `database/` directory.

#### Create New Migration

1. Create a migration file:
   ```bash
   database/migrations/005_add_new_table.sql
   ```

2. Define your schema changes

3. Run migrations:
   ```bash
   cd database/scripts
   ./reset.sh
   ./init.sh default
   docker compose up -d
   ```

## 🐳 Docker Services

### Docker Compose Services

All services are defined in `docker-compose.yml`:

#### MySQL Service
- **Image:** mysql:8.0
- **Container:** personal_website_db
- **Port:** 3306
- **Volume:** mysql_data (persistent storage)
- **Health Check:** mysqladmin ping

#### Backend Service
- **Build:** From /backend/Dockerfile (builder stage)
- **Container:** personal_website_backend
- **Port:** 5000
- **Environment:** DB connection details, NODE_ENV
- **Dependencies:** Waits for MySQL to be healthy
- **Hot Reload:** Watches /backend/src for changes (tsx watch)

#### Frontend Service
- **Build:** From /frontend/Dockerfile (builder stage)
- **Container:** personal_website_frontend
- **Port:** 3000
- **Dependencies:** Depends on backend service
- **Hot Reload:** Watches /frontend/src and /frontend/public for changes (Vite HMR)

> **Production builds:** Running `docker build` without docker compose produces
> lean, multi-stage images — the backend runs compiled JS without devDependencies,
> and the frontend is served by nginx.

### Common Docker Commands

```bash
# Start services in background
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f mysql

# Stop services
docker compose down

# Rebuild containers
docker compose up -d --build

# Remove all data (volumes)
docker compose down -v

# Execute command in running container
docker compose exec mysql mysql -u root -p personal_website < dump.sql
docker compose exec backend npm run build
```
## 🔒 Security

This project implements comprehensive security best practices:

### Frontend Security
- **Content Security Policy (CSP)** - Prevents XSS attacks by restricting resource loading
- **Security Headers** - Includes X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Error Boundaries** - React error boundary catches exceptions without exposing stack traces
- **HTML Escaping** - i18n configured with HTML entity escaping to prevent XSS
- **Secure Dependencies** - Uses Vite instead of react-scripts for minimal dependency footprint (~95% fewer dependencies)
- **Axios Security** - Configured with request timeouts and proper validation

### Backend Security
- **Environment Variables** - Sensitive data managed through .env files (not in version control)
- **CORS Configuration** - Properly configured with allowed origins
- **Input Validation** - Request validation on all endpoints
- **SQL Injection Prevention** - Using parameterized queries through MySQL driver
- **Error Handling** - Detailed errors logged but generic responses sent to clients

### Dependency Management
- **Regular Audits** - Run `npm audit` to check for vulnerabilities
- **Security Patches** - Dependencies kept up to date with security fixes
- **Minimal Dependencies** - Vite provides a smaller attack surface with fewer transitive dependencies

### Checking for Vulnerabilities

Frontend:
```bash
cd frontend
npm audit
npm audit fix  # To fix issues
```

Backend:
```bash
cd backend
npm audit
npm audit fix  # To fix issues
```
## 🔧 Troubleshooting

### Docker Issues

#### Containers won't start
```bash
# Check logs
docker compose logs

# Rebuild containers
docker compose down
docker compose up -d --build
```

#### MySQL connection errors
```bash
# Check logs
docker compose logs mysql

# Wait for MySQL to be ready (health check)
# Restart MySQL
docker compose restart mysql
```

#### Port already in use
```bash
# Find process using port
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :3306  # MySQL

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Database Issues

#### Database not initialized
```bash
cd database/scripts
./reset.sh
./init.sh default
docker compose up -d
```

#### Cannot connect to database
```bash
# Check MySQL is running
docker compose ps

# Check logs
docker compose logs mysql

# Verify credentials in .env or docker-compose.yml
```

#### Tables not created
```bash
# Check if migrations ran
docker compose exec mysql mysql -u root -p -e "SHOW TABLES;"

# Reinitialize database
cd database/scripts
./reset.sh
./init.sh default
docker compose down
docker compose up -d
```

### Frontend Issues

#### Frontend won't load
```bash
docker compose logs frontend
docker compose down
docker compose up -d --build
```

#### API calls failing
```bash
# Check backend is running
docker compose ps

# Check backend logs
docker compose logs backend

# Verify API_URL in frontend environment
```

### Backend Issues

#### Cannot connect to database
```bash
# Check database credentials
docker compose logs backend

# Verify all required environment variables are set
docker compose config | grep DB_
```

#### Port 5000 in use
```bash
# Change port in docker-compose.yml
# Change backend PORT variable in environment section
```

## 📚 Additional Documentation

- [Database Schema](database/SCHEMA.md) - Complete schema documentation with examples
- [Database Setup](database/README.md) - Detailed database configuration and management

## 📝 License

See [LICENSE](LICENSE) file for details.

## 👨‍💼 About

This project serves as both a demonstration of full-stack development capabilities and a living, interactive CV.
