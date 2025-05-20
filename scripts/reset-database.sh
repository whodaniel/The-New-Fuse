#!/bin/bash

# Reset PostgreSQL database for The New Fuse

echo "Resetting PostgreSQL database 'fuse'..."

# Drop the database if it exists
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS fuse;"

# Create a new database
psql -h localhost -U postgres -c "CREATE DATABASE fuse;"

echo "Database 'fuse' has been reset."

# Navigate to database package
cd packages/database

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running Prisma migrations..."
npx prisma migrate dev --name init

echo "Database setup complete!"
