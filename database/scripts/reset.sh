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
docker compose -f "$PROJECT_DIR/docker-compose.yml" down

echo "Removing MySQL volume..."
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
VOLUME_NAME="$(awk '/^volumes:/{found=1; next} found && /^[[:space:]]+[a-zA-Z0-9_-]+/{gsub(/:.*/, ""); gsub(/^[[:space:]]+/, ""); print $1; exit}' "$COMPOSE_FILE")"
if [ -z "$VOLUME_NAME" ]; then
  echo "Error: Could not determine MySQL volume name from $COMPOSE_FILE" >&2
  exit 1
fi
MYSQL_VOLUME="${PROJECT_NAME}_${VOLUME_NAME}"
docker volume rm "$MYSQL_VOLUME" 2>/dev/null || true

echo "Clearing initialization directory..."
rm -f "$DB_DIR/docker-entrypoint-initdb.d"/*.sql

echo "Database reset completed."
echo "To reinitialize the database, run: ./scripts/init.sh [seed_type]"
echo "Then start Docker: docker compose up -d"
