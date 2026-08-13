#!/bin/bash
set -e

echo "🔧 Fixing missing relations in database schema"

# 1. Determine which schema to use
if [ -f "packages/database/drizzle/schema.drizzle" ]; then
  echo "Using consolidated schema at packages/database/drizzle/schema.drizzle"
  SCHEMA_PATH="packages/database/drizzle/schema.drizzle"
  DRIZZLE_CMD="yarn workspace @the-new-fuse/database drizzle"
else
  echo "Using root schema at drizzle/schema.drizzle"
  SCHEMA_PATH="drizzle/schema.drizzle"
  DRIZZLE_CMD="yarn drizzle"
fi

# 2. First fix the Role enum issue if it exists
echo "🔄 Checking for Role enum issues..."
if [ -f "./scripts/fix-role-enum-migration.sh" ]; then
  echo "Running Role enum fix script..."
  ./scripts/fix-role-enum-migration.sh
else
  echo "Role enum fix script not found, applying manual fix..."
  # Apply the migration recovery SQL directly
  DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"')
  if [ -z "$DB_URL" ]; then
    echo "❌ DATABASE_URL not found in .env file"
    exit 1
  fi
  
  # Apply recovery SQL if it exists
  if [ -f "./scripts/migration-recovery.sql" ]; then
    echo "Applying migration recovery SQL..."
    psql $DB_URL -f ./scripts/migration-recovery.sql
  else
    echo "Creating migration recovery SQL..."
    cat > ./scripts/migration-recovery.sql << EOF
-- Drop the _drizzle_migrations table to start fresh
DROP TABLE IF EXISTS _drizzle_migrations;

-- Drop the enum type that might be causing issues
DROP TYPE IF EXISTS "Role_new";
DROP TYPE IF EXISTS "Role_old";
DROP TYPE IF EXISTS "Role";

-- Recreate the Role enum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'DEVELOPER');
EOF
    
    echo "Applying migration recovery SQL..."
    psql $DB_URL -f ./scripts/migration-recovery.sql
  fi
fi

# 3. Create a new migration for missing relations
echo "🆕 Creating a new migration for missing relations..."
$DRIZZLE_CMD migrate dev --name add_missing_relations --create-only

# 4. Edit the migration file to ensure it's compatible
MIGRATION_DIR=$($DRIZZLE_CMD migrate info | grep add_missing_relations | awk '{print $2}')
if [ -z "$MIGRATION_DIR" ]; then
  echo "❌ Could not find the migration directory"
  # Try to find it manually
  MIGRATION_DIR=$(find $(dirname $SCHEMA_PATH)/migrations -name "*add_missing_relations" -type d | head -n 1)
  if [ -z "$MIGRATION_DIR" ]; then
    echo "❌ Could not find the migration directory manually either"
    exit 1
  fi
fi

MIGRATION_FILE="$MIGRATION_DIR/migration.sql"
echo "📝 Editing migration file: $MIGRATION_FILE"

# Backup the original migration file
cp "$MIGRATION_FILE" "${MIGRATION_FILE}.bak"

# Modify the migration file to handle the Role enum properly
sed -i.bak 's/CREATE TYPE "Role_new"/-- CREATE TYPE "Role_new"/g' "$MIGRATION_FILE"
sed -i.bak 's/ALTER TABLE .* USING/-- ALTER TABLE ... USING/g' "$MIGRATION_FILE"
sed -i.bak 's/ALTER TYPE "Role_new"/-- ALTER TYPE "Role_new"/g' "$MIGRATION_FILE"
sed -i.bak 's/DROP TYPE "Role_old"/-- DROP TYPE "Role_old"/g' "$MIGRATION_FILE"

# 5. Apply the modified migration
echo "🔄 Applying the modified migration..."
$DRIZZLE_CMD migrate deploy

# 6. Generate Drizzle client
echo "📦 Generating Drizzle client..."
$DRIZZLE_CMD generate

# 7. Test database connection
echo "🔌 Testing database connection..."
$DRIZZLE_CMD db pull

# 8. Verify model accessibility
echo "🧪 Testing model accessibility..."
TEST_FILE="test-models.ts"

cat << EOF > $TEST_FILE
import { DrizzleClient } from '@the-new-fuse/database/client'
const drizzle = new DrizzleClient()

async function testModels() {
    try {
        await drizzle.$connect()
        // Test a few key models
        await drizzle.user.findMany({ take: 1 })
        await drizzle.agent.findMany({ take: 1 })
        await drizzle.feature.findMany({ take: 1 })
        console.log('✅ All models accessible')
    } catch (error) {
        console.error('❌ Model access failed:', error)
        process.exit(1)
    } finally {
        await drizzle.$disconnect()
    }
}

testModels()
EOF

# Run the test
yarn ts-node $TEST_FILE
rm $TEST_FILE

echo "✅ Database schema fix complete!"