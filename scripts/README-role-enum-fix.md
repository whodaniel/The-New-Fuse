# Role Enum Migration Fix

This directory contains scripts to fix issues with the Role enum in the database schema.

## Problem Description

The database migration is failing because of issues with the Role enum type in PostgreSQL. The specific error is:

```
ERROR: default for column "role" cannot be cast automatically to type "Role_new"
```

This happens because PostgreSQL doesn't automatically handle enum type conversions when default values are involved.

## Solution

We've created several scripts to fix this issue:

### 1. Comprehensive Fix Script (Recommended)

```bash
./scripts/fix-role-enum-migration-comprehensive.sh
```

This script:
- Creates a database backup
- Identifies all tables using the Role enum
- Creates and executes a SQL script to properly handle the enum conversion
- Marks the problematic migration as applied
- Generates the Prisma client

You will be prompted for the PostgreSQL password for the 'postgres' user.

### 2. Manual SQL Fix

If the script doesn't work, you can manually run the SQL fix:

```bash
cd packages/database
psql -U postgres -h localhost -d fuse -f fix_role_enum_comprehensive.sql
```

Then mark the migration as applied:

```bash
cd packages/database
npx prisma migrate resolve --applied "20250409015715_initial_schema"
npx prisma generate
```

### 3. Migration File

We've also created a proper migration file at:
`packages/database/prisma/migrations/20250409035715_fix_role_enum_comprehensive/`

You can apply this migration using:

```bash
cd packages/database
npx prisma migrate resolve --rolled-back "20250409015715_initial_schema"
npx prisma db execute --file=prisma/migrations/20250409035715_fix_role_enum_comprehensive/migration.sql
npx prisma migrate resolve --applied "20250409035715_fix_role_enum_comprehensive"
npx prisma generate
```

## After Fixing

After applying any of these fixes, you should be able to run:

```bash
cd packages/database
npx prisma migrate dev --name add_your_changes
```

To create new migrations as needed.

## Troubleshooting

If you encounter issues:

1. Check the database connection details in `packages/database/.env`
2. Verify that the Role enum exists in the database
3. Check which tables are using the Role enum
4. Consider dropping and recreating the database if all else fails:

```bash
dropdb -U postgres -h localhost fuse
createdb -U postgres -h localhost fuse
cd packages/database
npx prisma migrate reset --force
```
