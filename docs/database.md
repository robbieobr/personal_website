# Database

MySQL 8.0 schema, migrations, seed data, and the production seed for this project's data layer.

## Schema

Seven tables. `users` is the root; every other table has a foreign key back to it with `ON DELETE CASCADE`, so deleting a user removes all of their data.

### users

| Column                    | Type         | Notes                                   |
| ------------------------- | ------------ | --------------------------------------- |
| `id`                      | INT          | PK, auto-increment                      |
| `name`                    | VARCHAR(255) | NOT NULL                                |
| `title`                   | VARCHAR(255) | NOT NULL                                |
| `profileImage`            | VARCHAR(500) | nullable — path under `frontend/public` |
| `bio`                     | TEXT         | nullable                                |
| `createdAt` / `updatedAt` | TIMESTAMP    | DB-managed                              |

### contact_info

One row per contact method. Normalised out of `users` in migrations 008/009 (a BCNF split — `users` originally carried `email` and `phone` columns directly).

| Column                    | Type                                                | Notes              |
| ------------------------- | --------------------------------------------------- | ------------------ |
| `id`                      | INT                                                 | PK, auto-increment |
| `user_id`                 | INT                                                 | FK → `users(id)`   |
| `type`                    | ENUM('email','phone','website','github','linkedin') | NOT NULL           |
| `value`                   | VARCHAR(500)                                        | NOT NULL           |
| `display_order`           | INT                                                 | default 0          |
| `createdAt` / `updatedAt` | TIMESTAMP                                           | DB-managed         |

Unique on `(user_id, type)` — at most one entry per contact type per user. This table uses snake_case columns; the model query aliases `user_id`/`display_order` to `userId`/`displayOrder` for TypeScript consistency with the other tables.

### job_history, education, projects, skills, achievements

All five follow the same shape: a `userId INT NOT NULL` FK to `users(id)`, `createdAt`/`updatedAt`, and table-specific columns.

| Table          | Columns beyond `id`, `userId`, timestamps                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `job_history`  | `company`, `position` VARCHAR(255) NOT NULL; `startDate` DATE NOT NULL; `endDate` DATE nullable (NULL = current role); `description` TEXT nullable |
| `education`    | `institution`, `degree`, `field` VARCHAR(255) NOT NULL; `startDate` DATE NOT NULL; `endDate` DATE nullable; `description` TEXT nullable            |
| `projects`     | `title`, `role` VARCHAR(255) NOT NULL; `description` TEXT nullable                                                                                 |
| `skills`       | `skill` VARCHAR(255) NOT NULL                                                                                                                      |
| `achievements` | `title` VARCHAR(255) NOT NULL; `date` DATE NOT NULL; `description` TEXT nullable                                                                   |

## Migrations

Numbered `001`–`009` in `database/migrations/`, applied in order:

| File                                | Effect                                           |
| ----------------------------------- | ------------------------------------------------ |
| `001_create_database.sql`           | `CREATE DATABASE IF NOT EXISTS personal_website` |
| `002_create_users_table.sql`        | `users` (originally included `email`, `phone`)   |
| `003_create_job_history_table.sql`  | `job_history`                                    |
| `004_create_education_table.sql`    | `education`                                      |
| `005_create_projects_table.sql`     | `projects`                                       |
| `006_create_skills_table.sql`       | `skills`                                         |
| `007_create_achievements_table.sql` | `achievements`                                   |
| `008_create_contact_info_table.sql` | `contact_info`                                   |
| `009_remove_contact_from_users.sql` | Drops `email`/`phone` from `users`               |

A migration file is plain SQL executed once, in filename order, by the MySQL Docker image's entrypoint — there is no separate migration runner. To add one, create `database/migrations/010_your_change.sql` and then update the four places that consume the migrations directory: `database/init/minimal/`, `database/init/full/`, `database/docker-entrypoint-initdb.d/` (rebuild with `init.sh`, see below), and `database/prod-initdb.d/`.

## Seed profiles

Three profiles under `database/seeds/<profile>/`, each numbered `001` upward within its own directory. `001_users.sql` in every profile also seeds `contact_info`.

| Profile   | Users                                   | Jobs | Education | Projects | Skills | Achievements |
| --------- | --------------------------------------- | ---- | --------- | -------- | ------ | ------------ |
| `default` | 1 (John Doe)                            | 3    | 2         | 2        | 6      | 2            |
| `minimal` | 1 (Jane Smith)                          | 0    | 0         | 0        | 0      | 0            |
| `full`    | 3 (John Doe, Jane Smith, Alice Johnson) | 7    | 6         | 6        | 17     | 6            |

Counts confirmed by reading the seed files directly on this branch.

### How a profile reaches the database

MySQL's official image runs every `.sql`/`.sh` file it finds in `/docker-entrypoint-initdb.d/` inside the container, alphabetically, and only the first time a fresh volume is created. Each compose configuration mounts a different host directory to that path:

| Compose invocation                     | Host directory mounted                 | How that directory is produced                                                                                                                                       |
| -------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker compose up`                    | `database/docker-entrypoint-initdb.d/` | Generated by `database/scripts/init.sh [seed_type]` (defaults to `default`); committed pre-populated with the default seed so a fresh clone works with no extra step |
| `... -f docker-compose.minimal.yml up` | `database/init/minimal/`               | Committed as-is — migrations + the minimal seed, pre-combined and checked into git, not regenerated by any script                                                    |
| `... -f docker-compose.full.yml up`    | `database/init/full/`                  | Same — committed as-is                                                                                                                                               |
| `... -f docker-compose.prod.yml up`    | `database/prod-initdb.d/`              | Committed migrations + the read-only-user script; the production seed itself is gitignored (see below)                                                               |

`init.sh` only ever writes `docker-entrypoint-initdb.d/`. The `init/minimal` and `init/full` directories are static: when you add a migration or change the minimal/full seed data, update those two directories by hand (copy the new migration in, renumber seed files to start after the last migration — `init.sh`'s own renumbering logic is the reference for how).

Because these directories only take effect on a fresh MySQL volume, switching seed profiles on a running stack needs a reset first:

```bash
cd database/scripts
./reset.sh              # stops containers, drops the MySQL volume
./init.sh [seed_type]   # default, minimal, or full
cd ../..
docker compose up
```

## Production seed

`database/prod-initdb.d/500_prod_seed.sql.example` is the template for real deployment data — one user, their contact info, job history, education, projects, and skills. Copy it to `database/prod-initdb.d/500_prod_seed.sql` and fill in real values; that filename is gitignored (`database/prod-initdb.d/500_prod_seed.sql` in `.gitignore`) so personal data never reaches the repository. `tools/seo` also reads this same file at production image build time to generate the SEO artefacts — see `docs/seo.md`.

## Read-only application user

The production compose overlay creates a second MySQL user via `database/prod-initdb.d/900_readonly_user.sh`, run by the same entrypoint mechanism after the seed:

```bash
CREATE USER IF NOT EXISTS '${DB_READONLY_USER}'@'%' IDENTIFIED BY '${DB_READONLY_PASSWORD}';
GRANT SELECT ON personal_website.* TO '${DB_READONLY_USER}'@'%';
```

`docker-compose.prod.yml` points the backend at this user (`DB_USER`/`DB_PASSWORD` default to `DB_READONLY_USER`/`DB_READONLY_PASSWORD`, username defaulting to `webapp`) instead of `root`. Development and the three seed profiles above connect as `root` — the read-only user only exists in the production overlay.
