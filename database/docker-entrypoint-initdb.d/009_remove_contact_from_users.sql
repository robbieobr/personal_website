-- Remove email and phone columns from users table now that contact_info table exists
-- The unique index on email is removed along with the column (MySQL drops it automatically)
ALTER TABLE users DROP COLUMN email;
ALTER TABLE users DROP COLUMN phone;
