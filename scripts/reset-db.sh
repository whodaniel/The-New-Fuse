#!/bin/bash

# Reset PostgreSQL database and Drizzle setup for The New Fuse

set -e

echo "Starting database reset process..."

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if ! pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then
  echo "Error: PostgreSQL is not running or not accessible."
  echo "Please start PostgreSQL and try again."
  exit 1
fi

# Drop the database if it exists
echo "Dropping database 'fuse' if it exists..."
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS fuse;" || {
  echo "Error: Failed to drop database. Check PostgreSQL connection."
  exit 1
}

# Create a new database
echo "Creating new 'fuse' database..."
psql -h localhost -U postgres -c "CREATE DATABASE fuse;" || {
  echo "Error: Failed to create database. Check PostgreSQL connection."
  exit 1
}

# Navigate to database package
cd packages/database || {
  echo "Error: Could not find packages/database directory."
  exit 1
}

# Install dependencies if needed
echo "Installing dependencies..."
pnpm install || {
  echo "Error: Failed to install dependencies."
  exit 1
}

# Push Drizzle schema
echo "Applying Drizzle schema..."
pnpm drizzle:push || {
  echo "Error: Failed to apply Drizzle schema."
  exit 1
}

# Seed the database if available
if [ -f "./scripts/seed.ts" ] || [ -f "./scripts/seed.js" ]; then
  echo "Seeding the database..."
  pnpm drizzle:seed || {
    echo "Warning: Database seeding failed. You may need to seed manually."
  }
fi

echo "Database reset completed successfully!"
echo "The 'fuse' database has been recreated with the latest schema."
echo "You can now start your application."
