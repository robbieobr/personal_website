# Database Schema

This document describes the structure of the personal website database schema.

## Overview

The database consists of three main tables:
- **users** - User profile information
- **job_history** - Employment history records
- **education** - Educational background records

## Tables

### users

Stores user profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `name` | VARCHAR(255) | NOT NULL | User's full name |
| `title` | VARCHAR(255) | NOT NULL | Professional title/role |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User's email address |
| `phone` | VARCHAR(20) | NOT NULL | User's phone number |
| `profileImage` | VARCHAR(500) | Nullable | URL to profile image |
| `bio` | TEXT | Nullable | User's biography/about section |
| `createdAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Record last update timestamp |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `email`

---

### job_history

Stores employment history records for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique job record identifier |
| `userId` | INT | NOT NULL, FOREIGN KEY → users(id) | Reference to user (ON DELETE CASCADE) |
| `company` | VARCHAR(255) | NOT NULL | Company name |
| `position` | VARCHAR(255) | NOT NULL | Job position/title |
| `startDate` | DATE | NOT NULL | Employment start date |
| `endDate` | DATE | Nullable | Employment end date (NULL for current position) |
| `description` | TEXT | Nullable | Job description and achievements |
| `createdAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Record last update timestamp |

**Indexes:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `userId` → users(id)

**Relationships:**
- One-to-many relationship with `users` table
- When a user is deleted, all associated job history records are automatically deleted (CASCADE)

---

### education

Stores educational background records for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique education record identifier |
| `userId` | INT | NOT NULL, FOREIGN KEY → users(id) | Reference to user (ON DELETE CASCADE) |
| `institution` | VARCHAR(255) | NOT NULL | School/university name |
| `degree` | VARCHAR(255) | NOT NULL | Degree awarded (e.g., Bachelor of Science) |
| `field` | VARCHAR(255) | NOT NULL | Field of study |
| `startDate` | DATE | NOT NULL | Enrollment start date |
| `endDate` | DATE | Nullable | Graduation/completion date |
| `description` | TEXT | Nullable | Additional details (honors, specializations, etc.) |
| `createdAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updatedAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Record last update timestamp |

**Indexes:**
- PRIMARY KEY: `id`
- FOREIGN KEY: `userId` → users(id)

**Relationships:**
- One-to-many relationship with `users` table
- When a user is deleted, all associated education records are automatically deleted (CASCADE)

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ title           │
│ email (UNIQUE)  │
│ phone           │
│ profileImage    │
│ bio             │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         ├─────────────────────────────┐
         │                             │
    ┌────▼──────────────┐     ┌────────▼────────┐
    │  job_history      │     │   education     │
    ├───────────────────┤     ├─────────────────┤
    │ id (PK)           │     │ id (PK)         │
    │ userId (FK)       │     │ userId (FK)     │
    │ company           │     │ institution     │
    │ position          │     │ degree          │
    │ startDate         │     │ field           │
    │ endDate           │     │ startDate       │
    │ description       │     │ endDate         │
    │ createdAt         │     │ description     │
    │ updatedAt         │     │ createdAt       │
    └───────────────────┘     │ updatedAt       │
                              └─────────────────┘
```

---

## Data Types Reference

| Type | Description | Example |
|------|-------------|---------|
| INT | Integer | 1, 42, 999 |
| VARCHAR(n) | Variable-length string | 'John Doe', 'john@example.com' |
| TEXT | Large text field | Long descriptions, bios |
| DATE | Date in YYYY-MM-DD format | '2023-05-15' |
| TIMESTAMP | Date and time with automatic management | '2023-05-15 14:30:45' |

---

## Constraints Reference

| Constraint | Meaning |
|-----------|---------|
| PRIMARY KEY | Uniquely identifies each row |
| UNIQUE | All values in the column must be unique |
| NOT NULL | Column must always contain a value |
| FOREIGN KEY | References a column in another table |
| AUTO_INCREMENT | Value automatically increments for new rows |
| DEFAULT | Assigns a default value if none is provided |
| ON UPDATE | Automatically updates when the row is modified |
| ON DELETE CASCADE | Related rows are deleted when parent row is deleted |

---

## Sample Queries

### Get all jobs for a specific user
```sql
SELECT * FROM job_history
WHERE userId = 1
ORDER BY startDate DESC;
```

### Get user with their complete employment history
```sql
SELECT u.name, u.title, jh.company, jh.position, jh.startDate, jh.endDate
FROM users u
LEFT JOIN job_history jh ON u.id = jh.userId
WHERE u.id = 1
ORDER BY jh.startDate DESC;
```

### Get user with their complete education history
```sql
SELECT u.name, ed.institution, ed.degree, ed.field, ed.startDate, ed.endDate
FROM users u
LEFT JOIN education ed ON u.id = ed.userId
WHERE u.id = 1
ORDER BY ed.startDate DESC;
```

### Count jobs and education records per user
```sql
SELECT 
  u.id,
  u.name,
  COUNT(DISTINCT jh.id) as job_count,
  COUNT(DISTINCT ed.id) as education_count
FROM users u
LEFT JOIN job_history jh ON u.id = jh.userId
LEFT JOIN education ed ON u.id = ed.userId
GROUP BY u.id, u.name;
```

---

## Migration Files

The schema is created through the following migration files in order:

1. **001_create_database.sql** - Creates the database
2. **002_create_users_table.sql** - Creates the users table
3. **003_create_job_history_table.sql** - Creates the job_history table
4. **004_create_education_table.sql** - Creates the education table

See the `migrations/` directory for the actual SQL definitions.
