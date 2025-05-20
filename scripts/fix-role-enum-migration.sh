#!/bin/bash
set -e

echo "🔧 Fixing Role enum migration issue"

# 1. Backup the database (optional but recommended)
echo "📦 Creating database backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/db_backup_${TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"

# Get database connection info from environment
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"')
if [ -z "$DB_URL" ]; then
  echo "❌ DATABASE_URL not found in .env file"
  exit 1
fi

# Parse the connection string to get database name
DB_NAME=$(echo $DB_URL | sed -E 's/.*\/([^\/\?]+)(\?.*)?$/\1/')
DB_HOST=$(echo $DB_URL | sed -E 's/.*@([^:]+):.*/\1/')
DB_PORT=$(echo $DB_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')
DB_USER=$(echo $DB_URL | sed -E 's/.*:\/\/([^:]+):.*/\1/')

# Create backup
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "${BACKUP_DIR}/database_backup.sql"
echo "✅ Backup created at ${BACKUP_DIR}/database_backup.sql"

# 2. Apply the migration recovery SQL
echo "🔄 Applying migration recovery SQL..."
psql $DB_URL -f ./scripts/migration-recovery.sql

# 3. Reset Prisma migration state
echo "🗑️ Resetting Prisma migration state..."

# First, check which prisma schema is being used
if [ -f "packages/database/prisma/schema.prisma" ]; then
  echo "Using consolidated schema at packages/database/prisma/schema.prisma"
  SCHEMA_PATH="packages/database/prisma/schema.prisma"
  yarn workspace @the-new-fuse/database prisma migrate reset --force
else
  echo "Using root schema at prisma/schema.prisma"
  SCHEMA_PATH="prisma/schema.prisma"
  yarn prisma migrate reset --force
fi

# 4. Verify the Role enum is correctly defined
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

# 5. Create a new migration with the correct Role enum
echo "🆕 Creating a new migration with the correct Role enum..."

if [[ $SCHEMA_PATH == *"packages/database"* ]]; then
  yarn workspace @the-new-fuse/database prisma migrate dev --name fix_role_enum
else
  yarn prisma migrate dev --name fix_role_enum
fi

# 6. Verify the database connection
echo "🔌 Testing database connection..."

if [[ $SCHEMA_PATH == *"packages/database"* ]]; then
  yarn workspace @the-new-fuse/database prisma db pull
else
  yarn prisma db pull
fi

echo "✅ Role enum migration fix complete!"
echo "⚠️ If you encounter any issues, you can restore the database from the backup at ${BACKUP_DIR}/database_backup.sql"