-- Organization Model Migration Plan
-- This SQL represents the Organization model from schema.enhanced.prisma.backup
-- Ready to migrate when the project is prepared for the full multi-tenancy model

-- ==============================================================================
-- ORGANIZATION TABLES
-- ==============================================================================

-- Create OrganizationType enum
CREATE TYPE "OrganizationType" AS ENUM ('INDIVIDUAL', 'TEAM', 'ENTERPRISE', 'AGENCY');

-- Create MemberRole enum  
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER');

-- Create organizations table
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'TEAM',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "billingEmail" TEXT,
    "stripeCustomerId" TEXT,
    "settings" JSONB,
    "metadata" JSONB,
    "agentLimit" INTEGER NOT NULL DEFAULT 5,
    "storageLimit" BIGINT NOT NULL DEFAULT 10737418240,
    "computeUnitsLimit" INTEGER NOT NULL DEFAULT 10000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- Create unique index on slug
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE UNIQUE INDEX "organizations_stripeCustomerId_key" ON "organizations"("stripeCustomerId");
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");
CREATE INDEX "organizations_deletedAt_idx" ON "organizations"("deletedAt");

-- Create organization_members table
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'DEVELOPER',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- Create unique and index constraints
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");

-- Create organization_invitations table
CREATE TABLE "organization_invitations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_invitations_token_key" ON "organization_invitations"("token");
CREATE INDEX "organization_invitations_email_idx" ON "organization_invitations"("email");

-- ==============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================================================

-- Organization members foreign keys
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Organization invitations foreign key
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==============================================================================
-- MIGRATION NOTES
-- ==============================================================================

-- After running this migration:
-- 1. Add organizationId to User model: ALTER TABLE "users" ADD COLUMN "organizationId" TEXT;
-- 2. Add foreign key to users: ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" 
--    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL;
-- 3. Update AgencyService to use Organization model instead of Workspace
-- 4. Add 'organizations' relation to agents, workflows tables
-- 5. Update any code referencing workspaces as agencies to use organizations

-- ==============================================================================
-- DATA MIGRATION (run after schema)
-- ==============================================================================

-- Migrate workspaces that are agencies to organizations
-- INSERT INTO "organizations" (id, name, slug, type, settings, metadata, "isActive", "createdAt", "updatedAt")
-- SELECT 
--   w.id, 
--   COALESCE(w.description::json->>'displayName', w.name), 
--   w.name, 
--   'AGENCY',
--   w.description::json->'settings',
--   w.description::json,
--   true,
--   w."createdAt",
--   w."updatedAt"
-- FROM workspaces w
-- WHERE w.description::json->>'type' = 'AGENCY';
