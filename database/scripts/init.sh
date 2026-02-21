#!/bin/bash
# Database initialization script
# Usage: ./scripts/init.sh [seed_type]
# seed_type: default, minimal, or full (default: default)

SEED_TYPE=${1:-default}
DB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_INIT_DIR="$DB_DIR/docker-entrypoint-initdb.d"

echo "Initializing database with '$SEED_TYPE' seed dataset..."

# Create the docker-entrypoint-initdb.d directory if it doesn't exist
mkdir -p "$DOCKER_INIT_DIR"

# Clear existing initialization files
rm -f "$DOCKER_INIT_DIR"/*.sql

# Copy migration files
echo "Copying migration files..."
cp "$DB_DIR/migrations"/*.sql "$DOCKER_INIT_DIR/"

# Copy seed files for the specified seed type
if [ -d "$DB_DIR/seeds/$SEED_TYPE" ]; then
  echo "Copying $SEED_TYPE seed files..."
  cp "$DB_DIR/seeds/$SEED_TYPE"/*.sql "$DOCKER_INIT_DIR/"
else
  echo "Error: Seed type '$SEED_TYPE' not found in $DB_DIR/seeds/"
  echo "Available seed types:"
  ls -d "$DB_DIR/seeds"/*/ | xargs -n 1 basename
  exit 1
fi

echo "Database initialization completed."
echo "To start MySQL with these configurations, run: docker-compose up -d"
