#!/bin/bash

# Start PostgreSQL container
echo "Starting PostgreSQL container..."
docker run --name the-new-fuse-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=the_new_fuse_db -p 5432:5432 -d postgres:latest

# Wait for PostgreSQL to start
echo "Waiting for PostgreSQL to start..."
sleep 5

# Generate Prisma client
echo "Generating Prisma client..."
yarn workspace @the-new-fuse/database db:generate

# Run migrations
echo "Running database migrations..."
yarn workspace @the-new-fuse/database db:migrate

# Seed the database
echo "Seeding the database..."
yarn workspace @the-new-fuse/database seed

echo "Database setup complete!"
