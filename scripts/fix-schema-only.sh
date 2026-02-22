#!/bin/bash
set -e

echo "🔧 Fixing database schema issues (without backup)"

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

# 2. Check for .env file and create if it doesn't exist
if [ ! -f ".env" ]; then
  echo "⚠️ No .env file found. Creating one from .env.example..."
  cp .env.example .env
  echo "✅ Created .env file. Please edit it with your database credentials."
  echo "Press Enter to continue after editing the .env file..."
  read
fi

# 3. Get database connection info from environment
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"')
if [ -z "$DB_URL" ]; then
  echo "❌ DATABASE_URL not found in .env file"
  echo "Please enter your database connection URL (format: postgresql://username:password@localhost:5432/database_name):"
  read -r DB_URL
  echo "DATABASE_URL=\"$DB_URL\"" >> .env
fi

# 4. Parse the connection string to get database credentials
DB_NAME=$(echo $DB_URL | sed -E 's/.*\/([^\/\?]+)(\?.*)?$/\1/')
DB_HOST=$(echo $DB_URL | sed -E 's/.*@([^:]+):.*/\1/')
DB_PORT=$(echo $DB_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')
DB_USER=$(echo $DB_URL | sed -E 's/.*:\/\/([^:]+):.*/\1/')

# 5. Prompt for password if needed
echo "Please enter the database password for user '$DB_USER':"
read -s DB_PASSWORD

# Set PGPASSWORD environment variable for passwordless psql commands
export PGPASSWORD="$DB_PASSWORD"

# 6. Check if migration-recovery.sql exists, create if not
if [ ! -f "./scripts/migration-recovery.sql" ]; then
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
fi

# 7. Apply the migration recovery SQL
echo "🔄 Applying migration recovery SQL..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ./scripts/migration-recovery.sql
if [ $? -ne 0 ]; then
  echo "❌ Failed to apply migration recovery SQL"
  echo "Continuing anyway..."
fi

# 8. Verify the Role enum is correctly defined
echo "🔍 Verifying Role enum definition..."

# Check if the Role enum in the schema matches what we want
ROLE_ENUM_COUNT=$(grep -A 5 "enum Role" $SCHEMA_PATH | grep -c "DEVELOPER")

if [ "$ROLE_ENUM_COUNT" -eq 0 ]; then
  echo "⚠️ Role enum in $SCHEMA_PATH does not include DEVELOPER value"
  echo "Updating Role enum definition..."
  
  # Create a temporary file with the updated enum
  TMP_FILE=$(mktemp)
  sed '/enum Role {/,/}/c\
enum Role {\
  USER\
  ADMIN\
  DEVELOPER\
}' $SCHEMA_PATH > $TMP_FILE
  mv $TMP_FILE $SCHEMA_PATH
  
  echo "✅ Updated Role enum in $SCHEMA_PATH"
fi

# 9. Generate Drizzle client
echo "📦 Generating Drizzle client..."
$DRIZZLE_CMD generate

# 10. Test database connection using Drizzle
echo "🔌 Testing database connection with Drizzle..."
$DRIZZLE_CMD db pull

# 11. Verify model accessibility
echo "🧪 Testing model accessibility..."
TEST_FILE="test-models.ts"

cat << EOF > $TEST_FILE
import { DrizzleClient } from '@the-new-fuse/database/client'
const drizzle = new DrizzleClient()

async function testModels() {
    try {
        await drizzle.\$connect()
        // Test a few key models
        await drizzle.user.findMany({ take: 1 })
        await drizzle.agent.findMany({ take: 1 })
        await drizzle.feature.findMany({ take: 1 })
        console.log('✅ All models accessible')
    } catch (error) {
        console.error('❌ Model access failed:', error)
        process.exit(1)
    } finally {
        await drizzle.\$disconnect()
    }
}

testModels()
EOF

# Run the test
yarn ts-node $TEST_FILE
rm $TEST_FILE

# Clear the password from environment
unset PGPASSWORD

echo "✅ Database schema fix complete!"