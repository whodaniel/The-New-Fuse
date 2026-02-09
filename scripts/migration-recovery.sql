-- Drop the _prisma_migrations table to start fresh
DROP TABLE IF EXISTS _prisma_migrations;

-- Drop the enum type that might be causing issues
DROP TYPE IF EXISTS "Role_new";
DROP TYPE IF EXISTS "Role_old";
DROP TYPE IF EXISTS "Role";

-- Recreate the Role enum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');