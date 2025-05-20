#!/bin/bash

# Reset PostgreSQL database and Prisma setup for The New Fuse

echo "Starting Prisma database reset process..."

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
yarn install || {
  echo "Error: Failed to install dependencies."
  exit 1
}

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate || {
  echo "Error: Failed to generate Prisma client."
  exit 1
}

# Run initial migration
echo "Running initial Prisma migration..."
npx prisma migrate dev --name init || {
  echo "Error: Failed to run initial migration."
  exit 1
}

# Seed the database
echo "Seeding the database..."
npx prisma db seed || {
  echo "Warning: Database seeding failed. You may need to seed manually."
}

echo "Prisma database reset completed successfully!"
echo "The 'fuse' database has been recreated with the latest schema."
echo "You can now start your application."
