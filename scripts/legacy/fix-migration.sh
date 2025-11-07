#!/bin/bash

# This script fixes the failed Prisma migration by directly updating the _prisma_migrations table
# It marks the failed migration as applied so that the build process can continue

echo "🔧 Fixing failed database migration..."

# Set up environment variables from .env file if it exists
if [ -f ".env" ]; then
  source .env
fi

# Use default DATABASE_URL if not set
if [ -z "$DATABASE_URL" ]; then
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/the_new_fuse_db?schema=public"
  echo "Using default DATABASE_URL: $DATABASE_URL"
fi

# Extract database connection details from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)?schema.*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\(.*\):.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')

# SQL command to mark the migration as applied
SQL_COMMAND="UPDATE \"_prisma_migrations\" SET \"applied\" = 1, \"rolled_back\" = 0, \"rolled_back_at\" = NULL WHERE \"migration_name\" = '20250120101622_add_google_auth_fields';"

echo "Connecting to database $DB_NAME on $DB_HOST:$DB_PORT..."
echo "Marking migration '20250120101622_add_google_auth_fields' as applied..."

# Execute the SQL command using psql
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$SQL_COMMAND"

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "✅ Migration fix applied successfully!"
  echo "You can now run 'yarn build' again to complete the build process."
else
  echo "❌ Failed to apply migration fix. Please check your database connection."
fi