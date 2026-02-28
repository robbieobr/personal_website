# Database Structure

This directory contains the database schema, migrations, seed data, and related scripts for the personal website application.

## Directory Structure

```
database/
├── migrations/           # SQL migration files for creating tables
│   ├── 001_create_database.sql
│   ├── 002_create_users_table.sql
│   ├── 003_create_job_history_table.sql
│   ├── 004_create_education_table.sql
│   ├── 005_create_projects_table.sql
│   ├── 006_create_skills_table.sql
│   └── 007_create_achievements_table.sql
│
├── seeds/               # Seed data for different dataset configurations
│   ├── default/        # Default seed data (1 user with full career history)
│   │   ├── 001_users.sql
│   │   ├── 002_job_history.sql
│   │   ├── 003_education.sql
│   │   ├── 004_projects.sql
│   │   ├── 005_skills.sql
│   │   └── 006_achievements.sql
│   ├── minimal/        # Minimal seed data (1 user only)
│   │   └── 001_users.sql
│   └── full/           # Full seed data (3 users with complete history)
│       ├── 001_users.sql
│       ├── 002_job_history.sql
│       ├── 003_education.sql
│       ├── 004_projects.sql
│       ├── 005_skills.sql
│       └── 006_achievements.sql
│
├── scripts/            # Helper scripts for database management
│   ├── init.sh        # Initialize database with specified seed type
│   └── reset.sh       # Reset the database to clean state
│
├── docker-entrypoint-initdb.d/  # Files used by Docker MySQL initialization (dev)
│
├── prod-initdb.d/       # Files used by production Docker init (gitignored seed)
│   ├── 001-007_*.sql   # Migration copies
│   ├── 500_prod_seed.sql.example  # Template — copy to 500_prod_seed.sql and fill in
│   └── 900_readonly_user.sh       # Creates read-only MySQL user for the backend
│
├── init/                # Pre-combined init directories for compose override files
│   ├── minimal/        # Migrations + minimal seed
│   └── full/           # Migrations + full seed
└── README.md         # This file
```

## Quick Start

### Default Setup (Docker)

The default configuration uses the **default seed dataset** with:
- 1 user (John Doe)
- 3 job history entries
- 2 education entries
- 2 projects
- 6 skills
- 2 achievements

To start with default configuration:

```bash
docker compose up -d
```

## Seed Datasets

### Default Seed
Contains a standard test dataset with one primary user (John Doe) and their career history.

**Location:** `seeds/default/`

### Minimal Seed
Contains only a single user (Jane Smith) with no other records. Use this for:
- Testing UI with minimal data
- Performance testing
- Testing edge cases

**Location:** `seeds/minimal/`

### Full Seed
Contains an extended dataset with three users and their complete history:
- John Doe (Full Stack Developer)
- Jane Smith (DevOps Engineer)
- Alice Johnson (Product Manager)

This dataset includes job history, education, projects, skills, and achievements for all three users.

**Location:** `seeds/full/`

## Switching Between Seed Datasets

### Using Docker Compose (Recommended on initial setup)

**Option 1: Use compose override files**

Each override file mounts a pre-combined directory (`database/init/`) that contains the
migrations and the appropriate seed data:

Default dataset (already loaded):
```bash
docker compose up -d
```

Minimal dataset:
```bash
docker compose -f docker-compose.yml -f docker-compose.minimal.yml up -d
```

Full dataset:
```bash
docker compose -f docker-compose.yml -f docker-compose.full.yml up -d
```

Note: The MySQL data volume must be fresh (or reset) for initialization to take effect.

**Option 2: Using init.sh script (for re-initialization)**

First, initialize with desired seed type:
```bash
cd database/scripts
./init.sh default    # Load default seed (or minimal, full)
```

Then start or restart Docker:
```bash
docker compose up -d
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
docker compose up -d
```

## Adding New Migrations

To add a new table or modify the schema:

1. Create a new SQL file in `migrations/` with the next sequential number:
   ```bash
   # Example: 008_create_new_table.sql
   ```

2. Add corresponding seed data to each seed profile under `seeds/`:
   ```bash
   seeds/default/007_new_table.sql
   seeds/full/007_new_table.sql
   # (minimal only if needed)
   ```

3. Rebuild the `init/` directories by adding the new migration and renumbering seed files if needed:
   ```bash
   cp migrations/008_create_new_table.sql init/full/008_create_new_table.sql
   cp migrations/008_create_new_table.sql init/minimal/008_create_new_table.sql
   # Add seed files starting after the last migration number
   # e.g., if there are now 8 migrations, seeds start at 009
   ```

4. Add the new migration to `prod-initdb.d/`:
   ```bash
   cp migrations/008_create_new_table.sql prod-initdb.d/008_create_new_table.sql
   ```

5. For existing running containers, run the migration manually via MySQL client.

6. Reinitialize `docker-entrypoint-initdb.d/` for fresh-start parity:
   ```bash
   cd database/scripts
   ./init.sh default
   ```

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
   seeds/staging/004_projects.sql
   seeds/staging/005_skills.sql
   seeds/staging/006_achievements.sql
   ```

3. Populate with your desired data

4. Create a pre-combined init directory with migrations and seeds.
   Seed files must be numbered to execute **after** all migrations (currently 001–007),
   so start seeds at 008:
   ```bash
   mkdir -p init/staging
   cp migrations/*.sql init/staging/
   cp seeds/staging/001_users.sql init/staging/008_users.sql
   cp seeds/staging/002_job_history.sql init/staging/009_job_history.sql
   cp seeds/staging/003_education.sql init/staging/010_education.sql
   cp seeds/staging/004_projects.sql init/staging/011_projects.sql
   cp seeds/staging/005_skills.sql init/staging/012_skills.sql
   cp seeds/staging/006_achievements.sql init/staging/013_achievements.sql
   ```

5. Create a corresponding docker compose override file (optional):
   ```yaml
   # docker-compose.staging.yml
   services:
     mysql:
       volumes:
         - mysql_data:/var/lib/mysql
         - ./database/init/staging:/docker-entrypoint-initdb.d
   ```

## Docker Integration

### How It Works

1. When `docker compose up` is executed, Docker mounts the specified volumes to `/docker-entrypoint-initdb.d/` in the MySQL container

2. The MySQL Docker image automatically executes all `.sql` and `.sh` files in `/docker-entrypoint-initdb.d/` in alphabetical order

3. Files are executed only once, when the volume is first created. Subsequent containers reuse the existing data volume.

### Current Configuration

The `docker-compose.yml` is configured to mount:
```yaml
volumes:
  - ./database/docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d
```

This directory is pre-populated with the default seed dataset for quick startup.

## File Naming Convention

### Migrations
Migration files use a three-digit prefix that reflects their creation order:
- `001_create_database.sql` through `007_create_achievements_table.sql`

### Seeds (within `seeds/` directories)
Seed files within each `seeds/<profile>/` directory use three-digit prefixes starting at `001`:
- `001_users.sql`, `002_job_history.sql`, ..., `006_achievements.sql`

### Pre-combined init directories (`init/`, `docker-entrypoint-initdb.d/`)
When migrations and seeds are combined into a single directory for Docker, seed files must be
numbered to execute **after** all migrations. With 7 migrations, seeds start at `008`:
- Migrations: `001_create_database.sql` … `007_create_achievements_table.sql`
- Seeds: `008_users.sql` … `013_achievements.sql`

The `init.sh` script handles this renumbering automatically.

## Reference: Schema History

The schema was originally defined in a single `schema.sql` file that has since been split into
numbered migration files. The current schema (migrations 001–007) covers:
- `users` — user profile information
- `job_history` — employment records
- `education` — educational background
- `projects` — project portfolio entries
- `skills` — skill list entries
- `achievements` — career achievements

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
docker compose up -d
```

### Volume name mismatch

Ensure the Docker compose volume name matches what's referenced in reset.sh (`personal_website_mysql_data`)

## Best Practices

1. **Keep migrations separate from seeds** - Migrations define structure, seeds provide data
2. **Use meaningful comments** - Add SQL comments explaining the purpose of inserts
3. **Test new seeds locally** - Before committing new seed datasets, test them with Docker
4. **Use proper naming** - Sequential names ensure correct execution order
5. **Document custom seeds** - If adding custom seed datasets, update this README
