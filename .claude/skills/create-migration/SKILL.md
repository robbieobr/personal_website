---
name: create-migration
description: Scaffold the next numbered SQL migration file in database/migrations/ and remind user to update all seed profiles
disable-model-invocation: true
---

Create a new SQL migration for this project. Follow these steps exactly:

1. List all files in `database/migrations/` and find the highest sequence number (format: `NNN_verb_noun.sql`).
2. Determine the next sequence number (zero-padded to 3 digits, e.g. `005`).
3. Ask the user for a short snake_case description of the migration if not already provided (e.g. `add_skills_table`).
4. Create the file `database/migrations/NNN_<description>.sql` with this template:

```sql
-- Migration NNN: <description>
-- Created: <today's date>

USE personal_website;

-- TODO: Add your migration SQL here
-- Example:
-- CREATE TABLE example (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );
```

5. After creating the file, remind the user:
   - Update `database/seeds/default/` if the new table needs default seed data
   - Update `database/seeds/minimal/` for the minimal seed profile
   - Update `database/seeds/full/` for the full seed profile
   - Run `docker compose down -v && docker compose up` to apply the migration to a fresh DB
