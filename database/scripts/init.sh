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

# Copy seed files with renumbered prefixes starting after the last migration.
# Seeds are numbered sequentially beginning at (migration_count + 1) to ensure
# they always execute after all CREATE TABLE scripts.
if [ -d "$DB_DIR/seeds/$SEED_TYPE" ]; then
  echo "Copying $SEED_TYPE seed files..."
  migration_count=$(ls "$DB_DIR/migrations"/*.sql | wc -l)
  seed_num=$((migration_count + 1))
  for seed_file in $(ls -1 "$DB_DIR/seeds/$SEED_TYPE"/*.sql | sort); do
    filename=$(basename "$seed_file")
    name_without_prefix="${filename:4}"  # Strip the "NNN_" prefix
    new_name=$(printf "%03d_%s" "$seed_num" "$name_without_prefix")
    cp "$seed_file" "$DOCKER_INIT_DIR/$new_name"
    seed_num=$((seed_num + 1))
  done
else
  echo "Error: Seed type '$SEED_TYPE' not found in $DB_DIR/seeds/"
  echo "Available seed types:"
  ls -d "$DB_DIR/seeds"/*/ | xargs -n 1 basename
  exit 1
fi

echo "Database initialization completed."
echo "To start MySQL with these configurations, run: docker-compose up -d"
