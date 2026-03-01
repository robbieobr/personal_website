# Backend

Node.js + Express + TypeScript API server for the personal website.

## 📋 Overview

This is the backend API that provides:
- RESTful endpoints for user profiles
- Job history management
- Education records
- MySQL database integration

## 🛠 Technology Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MySQL** - Database
- **tsx** - TypeScript execution with auto-reload

## 📁 Directory Structure

```
backend/
├── src/
│   ├── index.ts                # Application entry point
│   │
│   ├── config/                 # Configuration
│   │   └── database.ts         # Database connection setup
│   │
│   ├── controllers/            # Request handlers
│   │   ├── userController.ts           # User endpoints
│   │   ├── contactInfoController.ts    # Contact info endpoints
│   │   ├── jobController.ts            # Job endpoints
│   │   ├── educationController.ts      # Education endpoints
│   │   ├── projectController.ts        # Project endpoints
│   │   ├── skillController.ts          # Skill endpoints
│   │   └── achievementController.ts    # Achievement endpoints
│   │
│   ├── routes/                 # Route definitions
│   │   ├── userRoutes.ts           # /api/users routes
│   │   ├── contactInfoRoutes.ts    # /api/contact-info routes
│   │   ├── jobRoutes.ts            # /api/jobs routes
│   │   ├── educationRoutes.ts      # /api/education routes
│   │   ├── projectRoutes.ts        # /api/projects routes
│   │   ├── skillRoutes.ts          # /api/skills routes
│   │   └── achievementRoutes.ts    # /api/achievements routes
│   │
│   ├── models/                 # Data models
│   │   └── index.ts            # Model definitions
│   │
│   └── types/                  # TypeScript interfaces
│       └── index.ts            # Type definitions
│
├── .env.example               # Environment variables template
├── Dockerfile                 # Docker configuration
├── package.json              # Node dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🚀 Quick Start

### With Docker

The backend is automatically built and started with Docker Compose:

```bash
cd ..
docker compose up -d
```

Access at http://localhost:5000

### Local Development (Without Docker)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=rootpassword
   DB_NAME=personal_website
   PORT=5000
   NODE_ENV=development
   ```

3. **Ensure MySQL is running:**
   ```bash
   # Option 1: Docker
   docker run -d \
     --name mysql \
     -e MYSQL_ROOT_PASSWORD=rootpassword \
     -e MYSQL_DATABASE=personal_website \
     -p 3306:3306 \
     mysql:8.0

   # Option 2: Local MySQL installation
   # Ensure MySQL service is running and configured
   ```

4. **Initialize the database:**
   ```bash
   cd ../database/scripts
   ./init.sh default
   cd ../../backend
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

   Server runs on http://localhost:5000

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with auto-reload (tsx watch) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Run compiled JavaScript server |

## 🔌 API Endpoints

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get specific user by ID |
| GET | `/api/users/:id/profile` | Get user with full profile (all sections) |

### Contact Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contact-info/:userId` | Get contact info for specific user |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/user/:userId` | Get jobs for specific user |

### Education

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/education/user/:userId` | Get education records for specific user |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/user/:userId` | Get projects for specific user |

### Skills

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills/user/:userId` | Get skills for specific user |

### Achievements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/achievements/user/:userId` | Get achievements for specific user |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (verifies database connectivity) |

## 🗄️ Database Connection

The backend automatically connects to MySQL using the configured environment variables.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | localhost |
| `DB_PORT` | MySQL port | 3306 |
| `DB_USER` | MySQL user | root |
| `DB_PASSWORD` | MySQL password | rootpassword |
| `DB_NAME` | Database name | personal_website |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |

### Connection Pool

The database module uses connection pools for better performance. Connection parameters can be adjusted in `src/config/database.ts`.

## 💻 Development Workflow

### Adding a New Endpoint

1. **Create Controller:**
   ```typescript
   // src/controllers/newController.ts
   import { Request, Response } from 'express';

   export const getNewData = (req: Request, res: Response) => {
     // Implementation
     res.json({ data: [] });
   };
   ```

2. **Create Routes:**
   ```typescript
   // src/routes/newRoutes.ts
   import express from 'express';
   import { getNewData } from '../controllers/newController';

   const router = express.Router();
   router.get('/', getNewData);
   export default router;
   ```

3. **Register Routes in `index.ts`:**
   ```typescript
   import newRoutes from './routes/newRoutes';
   app.use('/api/new', newRoutes);
   ```

4. **Add Types if needed in `src/types/index.ts`**

### Database Queries

Use the MySQL2/promise pool to execute queries:

```typescript
import pool from '../config/database';

const connection = await pool.getConnection();
try {
  const [results] = await connection.execute('SELECT * FROM users');
  console.log(results);
} finally {
  connection.release();
}
```

Or use the pool directly with `execute` (uses parameterized queries for SQL injection prevention):

```typescript
const [results] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
```

## 🐳 Docker Configuration

### Build Image

```bash
docker build -t personal_website_backend .
```

### Run Container

```bash
docker run \
  -p 5000:5000 \
  -e DB_HOST=mysql \
  -e DB_PORT=3306 \
  -e DB_USER=root \
  -e DB_PASSWORD=rootpassword \
  -e DB_NAME=personal_website \
  personal_website_backend
```

### Dockerfile Details

- **Base Image:** node:20-alpine (both stages)
- **Builder Stage:** Installs all dependencies, compiles TypeScript to JavaScript
- **Production Stage:** Installs only runtime dependencies (no devDependencies), runs compiled JS
- **Port:** 5000
- **Hot Reload:** Uses tsx watch when running with docker compose (builder stage with `npm run dev`)

## 🔧 Troubleshooting

### Port 5000 Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

### Cannot Connect to Database

```bash
# Check MySQL is running
docker ps | grep mysql

# Verify connection parameters
cat .env

# Test connection with mysql-cli
mysql -h localhost -u root -p -e "SHOW DATABASES;"

# Check backend logs
npm run dev
```

### Database Not Initialized

```bash
# Initialize database with seed
cd ../database/scripts
./init.sh default
cd ../../backend
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Rebuild TypeScript
npm run build
```

### CORS Errors in Frontend

If frontend can't connect to API:

```bash
# Verify backend is running
curl http://localhost:5000/api/users

# Check CORS is enabled in Express
# Should be configured in src/index.ts
```

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all files
- Define request/response types
- Use strict mode in tsconfig.json
- Avoid using `any` type

### Express Route Pattern

```typescript
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  // Implementation
  res.json({ id });
});

export default router;
```

### Error Handling

```typescript
router.get('/', async (req: Request, res: Response) => {
  try {
    // Query or operation
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## 🔐 Security Best Practices

- Keep `.env` file out of version control (use `.env.example`)
- Use environment variables for sensitive data
- Validate and sanitize user inputs
- Never commit actual passwords or API keys
- Use CORS appropriately for frontend domain

## 🚢 Production Deployment

Production runs via the Docker Compose production overlay, which uses the `production` build target in the Dockerfile (compiled JS, no devDependencies, no source mounts) and connects to MySQL with a read-only user.

```bash
# From the project root
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

See the project root `TODO.md` for the full pre-deployment checklist and `.env.prod.example` for the required environment variables.

## 📚 Additional Resources

- [Main Project README](../README.md) - Project overview and global setup
- [Frontend README](../frontend/README.md) - Frontend documentation
- [Database Setup](../database/README.md) - Database configuration
- [Database Schema](../database/SCHEMA.md) - Detailed schema documentation

## 🔄 CORS Configuration

CORS (Cross-Origin Resource Sharing) is configured in `src/index.ts` to allow requests from the frontend.

If you need to allow additional origins, update the CORS configuration:

```typescript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

## 🆘 Support

For issues related to:
- **Database:** See [database/README.md](../database/README.md)
- **Project Setup:** See [README.md](../README.md)
- **Frontend Integration:** See [frontend/README.md](../frontend/README.md)
