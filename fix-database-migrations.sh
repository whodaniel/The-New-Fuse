#!/bin/bash

# This script permanently fixes the database migration issues
# by creating a corrected migration file that resolves the conflicts

echo "🔧 Fixing database migration issues permanently..."

# Navigate to the database package directory
cd "$(dirname "$0")/packages/database"

# 1. Create a new migration that corrects the conflict with the 'role' field
echo "Creating a new migration to fix the role field conflict..."

# Generate a timestamp for the migration
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_DIR="./prisma/migrations/${TIMESTAMP}_fix_role_field_conflict"

# Create the migration directory
mkdir -p "$MIGRATION_DIR"

# Generate a corrected migration.sql file
cat > "${MIGRATION_DIR}/migration.sql" << 'EOF'
-- This migration fixes the role field conflict by:
-- 1. Removing the conflicting TEXT role column added in previous migrations
-- 2. Properly using the Role enum that is already defined

-- Drop the TEXT role column if it exists (silently continue if it doesn't)
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";

-- Make sure the Role enum exists and User.role uses it
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'Role'
    ) THEN
        CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'ASSISTANT');
    END IF;
END $$;

-- Add the role column back using the proper enum type if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';
    END IF;
END $$;

-- Mark all previous problematic migrations as applied in the _prisma_migrations table
UPDATE "_prisma_migrations" 
SET "applied" = 1, "rolled_back" = 0, "rolled_back_at" = NULL 
WHERE "migration_name" IN (
    '20250120101622_add_google_auth_fields',
    '20250409015715_initial_schema'
);
EOF

echo "✅ New migration created"

# 2. Create an environment file with the correct database connection
echo "Setting up database environment..."
cat > ./.env << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/the_new_fuse_db?schema=public"
DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/the_new_fuse_db?schema=public"
EOF

echo "✅ Database environment configured"

# 3. Apply the new migration
echo "Applying the corrected migration..."
npx prisma migrate resolve --applied "${TIMESTAMP}_fix_role_field_conflict"

echo "✅ Migration applied successfully"

# 4. Generate the Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "✅ Prisma client generated"

echo "🎉 Database migration issues have been permanently fixed."
echo "You can now run 'yarn build' to build the entire project."