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

# Generate Drizzle client
echo "Generating Drizzle client..."
npx drizzle generate

# Run migrations
echo "Running Drizzle migrations..."
npx drizzle migrate dev --name init

echo "Database setup complete!"
