#!/bin/bash

# Check if PostgreSQL is running
pg_status=$(pg_ctl status 2>&1)
if [[ $pg_status == *"no server running"* ]]; then
  echo "Starting PostgreSQL server..."
  pg_ctl start -D /usr/local/var/postgres
  sleep 2
fi

# Create the database if it doesn't exist
if ! psql -lqt | cut -d \| -f 1 | grep -qw the_new_fuse_db; then
  echo "Creating database the_new_fuse_db..."
  createdb the_new_fuse_db
fi

# Generate Prisma client
echo "Generating Prisma client..."
cd packages/database && yarn db:generate

# Run migrations
echo "Running database migrations..."
cd packages/database && yarn db:migrate

# Seed the database
echo "Seeding the database..."
cd packages/database && yarn seed

echo "Database setup complete!"
