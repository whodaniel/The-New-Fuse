#!/bin/bash

# Set strict error handling
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define paths
DB_DIR="packages/database"
SCHEMA_PATH="$DB_DIR/prisma/schema.prisma"
MIGRATION_PATH="$DB_DIR/prisma/migrations"
PROBLEM_MIGRATION="20250409015715_initial_schema"
SQL_FIX_PATH="$DB_DIR/fix_role_enum_comprehensive.sql"

# Print header
echo -e "${BLUE}🔧 Comprehensive Role enum migration fix script${NC}"
echo -e "${BLUE}================================================${NC}"

# Function to check if a table exists in the database
check_table_exists() {
  local table_name=$1
  local count=$(psql -U postgres -h localhost -d fuse -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table_name';")
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error checking if table $table_name exists${NC}"
    return 1
  fi
  
  if [ "$count" -gt 0 ]; then
    return 0
  else
    return 1
  fi
}

# Function to check if a column exists in a table
check_column_exists() {
  local table_name=$1
  local column_name=$2
  local count=$(psql -U postgres -h localhost -d fuse -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = '$table_name' AND column_name = '$column_name';")
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error checking if column $column_name exists in table $table_name${NC}"
    return 1
  fi
  
  if [ "$count" -gt 0 ]; then
    return 0
  else
    return 1
  fi
}

# Function to check if an enum type exists
check_enum_exists() {
  local enum_name=$1
  local count=$(psql -U postgres -h localhost -d fuse -t -c "SELECT COUNT(*) FROM pg_type WHERE typname = '$enum_name';")
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error checking if enum $enum_name exists${NC}"
    return 1
  fi
  
  if [ "$count" -gt 0 ]; then
    return 0
  else
    return 1
  fi
}

# Function to get tables using the Role enum
get_tables_using_role_enum() {
  local tables=$(psql -U postgres -h localhost -d fuse -t -c "SELECT table_name, column_name FROM information_schema.columns WHERE udt_name = 'role';")
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error getting tables using Role enum${NC}"
    return 1
  fi
  
  echo "$tables"
}

# Ask for database password
echo -e "${YELLOW}Please enter the database password for user 'postgres':${NC}"
read -s DB_PASSWORD
export PGPASSWORD="$DB_PASSWORD"

# Check database connection
echo -e "${BLUE}🔍 Testing database connection...${NC}"
if ! psql -U postgres -h localhost -d fuse -c "SELECT 1" > /dev/null 2>&1; then
  echo -e "${RED}❌ Failed to connect to the database. Please check your password and try again.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Database connection successful${NC}"

# Create database backup
echo -e "${BLUE}📦 Creating database backup...${NC}"
BACKUP_FILE="fuse_db_backup_$(date +%Y%m%d_%H%M%S).sql"
if pg_dump -U postgres -h localhost -d fuse > "$BACKUP_FILE" 2>/dev/null; then
  echo -e "${GREEN}✅ Database backup created: $BACKUP_FILE${NC}"
else
  echo -e "${YELLOW}⚠️ Failed to create database backup. Continuing without backup.${NC}"
fi

# Check if Role enum exists
echo -e "${BLUE}🔍 Checking if Role enum exists...${NC}"
if check_enum_exists "role"; then
  echo -e "${GREEN}✅ Role enum exists${NC}"
else
  echo -e "${YELLOW}⚠️ Role enum does not exist. It might have been renamed or dropped.${NC}"
fi

# Get tables using Role enum
echo -e "${BLUE}🔍 Finding tables using Role enum...${NC}"
TABLES_USING_ROLE=$(get_tables_using_role_enum)
if [ -z "$TABLES_USING_ROLE" ]; then
  echo -e "${YELLOW}⚠️ No tables found using Role enum${NC}"
else
  echo -e "${GREEN}✅ Found tables using Role enum:${NC}"
  echo "$TABLES_USING_ROLE"
fi

# Create SQL fix script
echo -e "${BLUE}📝 Creating SQL fix script...${NC}"
cat > "$SQL_FIX_PATH" << 'EOF'
-- Comprehensive fix for Role enum
BEGIN;

-- Create a new enum type with all the values
CREATE TYPE "Role_new" AS ENUM ('USER', 'ADMIN', 'DEVELOPER', 'AGENT');

-- Function to handle tables using Role enum
CREATE OR REPLACE FUNCTION fix_role_enum() RETURNS void AS $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE udt_name = 'role'
    LOOP
        -- Check if column has default value
        DECLARE
            has_default boolean;
            default_value text;
        BEGIN
            SELECT INTO has_default, default_value
                pg_get_expr(d.adbin, d.adrelid) IS NOT NULL,
                pg_get_expr(d.adbin, d.adrelid)
            FROM pg_catalog.pg_attribute a
            LEFT JOIN pg_catalog.pg_attrdef d ON (a.attrelid, a.attnum) = (d.adrelid, d.adnum)
            WHERE a.attrelid = tbl.table_name::regclass
            AND a.attname = tbl.column_name
            AND a.attnum > 0
            AND NOT a.attisdropped;
            
            -- Drop default if exists
            IF has_default THEN
                EXECUTE format('ALTER TABLE "%I" ALTER COLUMN "%I" DROP DEFAULT', tbl.table_name, tbl.column_name);
            END IF;
            
            -- Set any NULL values to USER
            EXECUTE format('UPDATE "%I" SET "%I" = ''USER'' WHERE "%I" IS NULL', 
                tbl.table_name, tbl.column_name, tbl.column_name);
            
            -- Convert column to use new enum
            EXECUTE format('ALTER TABLE "%I" ALTER COLUMN "%I" TYPE "Role_new" USING ("%I"::text::"Role_new")', 
                tbl.table_name, tbl.column_name, tbl.column_name);
            
            -- Set default back if it existed
            IF has_default THEN
                -- Extract the enum value from the default expression
                DECLARE
                    enum_value text;
                BEGIN
                    enum_value := regexp_replace(default_value, '.*''([^'']+)''.*', '\1');
                    -- Set default back
                    EXECUTE format('ALTER TABLE "%I" ALTER COLUMN "%I" SET DEFAULT ''%s''::"Role_new"', 
                        tbl.table_name, tbl.column_name, enum_value);
                END;
            END IF;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT fix_role_enum();

-- Drop the function
DROP FUNCTION fix_role_enum();

-- Drop the old enum type if it exists
DROP TYPE IF EXISTS "Role";

-- Rename the new enum type to the original name
ALTER TYPE "Role_new" RENAME TO "Role";

COMMIT;
EOF

echo -e "${GREEN}✅ SQL fix script created at $SQL_FIX_PATH${NC}"

# Execute the SQL fix script
echo -e "${BLUE}🔧 Executing SQL fix script...${NC}"
if psql -U postgres -h localhost -d fuse -f "$SQL_FIX_PATH"; then
  echo -e "${GREEN}✅ SQL fix script executed successfully${NC}"
else
  echo -e "${RED}❌ Failed to execute SQL fix script${NC}"
  exit 1
fi

# Mark the problematic migration as applied
echo -e "${BLUE}🔧 Marking problematic migration as applied...${NC}"
cd "$DB_DIR" && npx prisma migrate resolve --applied "$PROBLEM_MIGRATION"
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to mark migration as applied${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Migration marked as applied${NC}"

# Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
cd "$DB_DIR" && npx prisma generate
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to generate Prisma client${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Prisma client generated${NC}"

# Verify database status
echo -e "${BLUE}🔍 Verifying database migration status...${NC}"
cd "$DB_DIR" && npx prisma migrate status
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to verify migration status${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Role enum migration fix completed successfully${NC}"
echo -e "${BLUE}You can now run 'npx prisma migrate dev --name add_your_changes' to create new migrations${NC}"
