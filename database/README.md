# Database Structure

This directory contains the database schema, migrations, seed data, and related scripts for the personal website application.

## Directory Structure

```
database/
├── migrations/           # SQL migration files for creating tables
│   ├── 001_create_database.sql
│   ├── 002_create_users_table.sql
│   ├── 003_create_job_history_table.sql
│   └── 004_create_education_table.sql
│
├── seeds/               # Seed data for different dataset configurations
│   ├── default/        # Default seed data (1 user, 3 jobs, 2 education records)
│   │   ├── 001_users.sql
│   │   ├── 002_job_history.sql
│   │   └── 003_education.sql
│   ├── minimal/        # Minimal seed data (1 user only)
│   │   └── 001_users.sql
│   └── full/           # Full seed data (3 users, 7 jobs, 6 education records)
│       ├── 001_users.sql
│       ├── 002_job_history.sql
│       └── 003_education.sql
│
├── scripts/            # Helper scripts for database management
│   ├── init.sh        # Initialize database with specified seed type
│   └── reset.sh       # Reset the database to clean state
│
├── docker-entrypoint-initdb.d/  # Files used by Docker MySQL initialization
│   └── (auto-populated by init.sh)
│
├── schema.sql         # Original schema file (kept for reference)
└── README.md         # This file
```

## Quick Start

### Default Setup (Docker)

The default configuration uses the **default seed dataset** with:
- 1 user (John Doe)
- 3 job history entries
- 2 education entries

To start with default configuration:

```bash
docker-compose up -d
```

## Seed Datasets

### Default Seed
Contains a standard test dataset with one primary user (John Doe) and their career history.

**Location:** `seeds/default/`

### Minimal Seed
Contains only a single user (Jane Smith) with no job or education history. Use this for:
- Testing UI with minimal data
- Performance testing
- Testing edge cases

**Location:** `seeds/minimal/`

### Full Seed
Contains an extended dataset with three users and their complete history:
- John Doe (Full Stack Developer)
- Jane Smith (DevOps Engineer)
- Alice Johnson (Product Manager)

This dataset includes 7 job history entries and 6 education records.

**Location:** `seeds/full/`

## Switching Between Seed Datasets

### Using Docker Compose (Recommended on initial setup)

**Option 1: Use compose override files**

Default dataset (already loaded):
```bash
docker-compose up -d
```

Minimal dataset:
```bash
docker-compose -f docker-compose.yml -f docker-compose.minimal.yml up -d
```

Full dataset:
```bash
docker-compose -f docker-compose.yml -f docker-compose.full.yml up -d
```

**Option 2: Using init.sh script (for re-initialization)**

First, initialize with desired seed type:
```bash
cd database/scripts
./init.sh default    # Load default seed (or minimal, full)
```

Then start or restart Docker:
```bash
docker-compose up -d
```

Note: The volume must be fresh for initialization to work. See "Resetting the Database" section below.

## Resetting the Database

To completely reset the database and start fresh:

```bash
cd database/scripts
./reset.sh
```

This will:
1. Stop all Docker containers
2. Remove the MySQL data volume
3. Clear the initialization files

After reset, to reinitialize with a specific seed:
```bash
./init.sh [seed_type]  # seed_type: default, minimal, or full
docker-compose up -d
```

## Adding New Migrations

To add a new table or modify the schema:

1. Create a new SQL file in `migrations/` with the next sequential number:
   ```bash
   # Example: 005_create_projects_table.sql
   ```

2. The file will be automatically included when Docker initializes (if you've set it up with init.sh)

3. For existing running containers, you'll need to run the migration manually via MySQL client

## Adding New Seed Datasets

To create a new seed dataset (e.g., `staging`):

1. Create a new directory under `seeds/`:
   ```bash
   mkdir -p seeds/staging
   ```

2. Create SQL files for each table:
   ```bash
   seeds/staging/001_users.sql
   seeds/staging/002_job_history.sql
   seeds/staging/003_education.sql
   ```

3. Populate with your desired data

4. Create a corresponding docker-compose override file (optional):
   ```yaml
   # docker-compose.staging.yml
   version: '3.8'
   services:
     mysql:
       volumes:
         - mysql_data:/var/lib/mysql
         - ./database/migrations:/docker-entrypoint-initdb.d/migrations
         - ./database/seeds/staging:/docker-entrypoint-initdb.d/seeds
   ```

## Docker Integration

### How It Works

1. When `docker-compose up` is executed, Docker mounts the specified volumes to `/docker-entrypoint-initdb.d/` in the MySQL container

2. The MySQL Docker image automatically executes all `.sql` files in `/docker-entrypoint-initdb.d/` in alphabetical order

3. Files are executed only once, when the volume is first created. Subsequent containers reuse the existing data volume.

### Current Configuration

The `docker-compose.yml` is configured to mount:
```yaml
volumes:
  - ./database/docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d
```

This directory is pre-populated with the default seed dataset for quick startup.

## File Naming Convention

Both migrations and seed files use a three-digit prefix for ordering:
- `001_*` - First to execute
- `002_*` - Second to execute
- etc.

This ensures proper execution order when Docker processes the files alphabetically.

## Reference: Original Schema

The original `schema.sql` file has been split into:
- **Migrations** - Table definitions (`001*.sql` to `004*.sql`)
- **Seeds/Default** - Sample data (in `seeds/default/`)

The original file is kept for reference but is no longer used by Docker.

## Troubleshooting

### "Database initialization failed" or data not loaded

This usually means:
1. The volume already exists with data. You need to reset it:
   ```bash
   ./scripts/reset.sh
   ```

2. Or check that the SQL files are properly formatted and have no syntax errors

### Changes not taking effect after running init.sh

The MySQL Docker volume persists data. You must reset before changes take effect:
```bash
./scripts/reset.sh
./scripts/init.sh [seed_type]
docker-compose up -d
```

### Volume name mismatch

Ensure the Docker compose volume name matches what's referenced in reset.sh (`personal_website_mysql_data`)

## Best Practices

1. **Keep migrations separate from seeds** - Migrations define structure, seeds provide data
2. **Use meaningful comments** - Add SQL comments explaining the purpose of inserts
3. **Test new seeds locally** - Before committing new seed datasets, test them with Docker
4. **Use proper naming** - Sequential names ensure correct execution order
5. **Document custom seeds** - If adding custom seed datasets, update this README
