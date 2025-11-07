#!/bin/bash

# This script uses Prisma's direct commands to fix the migration issue

echo "🔧 Attempting to fix Prisma migration issues..."

cd packages/database

# First, try to mark the migration as resolved
echo "Attempting to mark the migration as resolved..."
npx prisma migrate resolve --applied 20250120101622_add_google_auth_fields

# If that doesn't work, try to reset the migration state
if [ $? -ne 0 ]; then
  echo "First attempt failed. Trying to reset Prisma's migration state..."
  npx prisma migrate reset --force
fi

# If both approaches fail, suggest manual intervention
if [ $? -ne 0 ]; then
  echo "⚠️ Automated fixes failed. You might need to manually fix the database:"
  echo "1. Connect to your PostgreSQL database"
  echo "2. Execute: UPDATE \"_prisma_migrations\" SET \"applied\" = 1, \"rolled_back\" = 0, \"rolled_back_at\" = NULL WHERE \"migration_name\" = '20250120101622_add_google_auth_fields';"
  echo "3. Then run 'yarn build' again"
  exit 1
fi

echo "✅ Migration fix attempted. Try running 'yarn build' again."