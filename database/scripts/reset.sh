#!/bin/bash
# Database reset script
# This script removes the Docker MySQL volume to reset the database

DB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$(cd "$DB_DIR/.." && pwd)"

echo "WARNING: This will delete all data in the MySQL database!"
read -p "Are you sure you want to reset the database? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Reset cancelled."
  exit 0
fi

echo "Stopping Docker containers..."
docker-compose -f "$PROJECT_DIR/docker-compose.yml" down

echo "Removing MySQL volume..."
docker volume rm personal_website_mysql_data 2>/dev/null || true

echo "Clearing initialization directory..."
rm -f "$DB_DIR/docker-entrypoint-initdb.d"/*.sql

echo "Database reset completed."
echo "To reinitialize the database, run: ./scripts/init.sh [seed_type]"
echo "Then start Docker: docker-compose up -d"
