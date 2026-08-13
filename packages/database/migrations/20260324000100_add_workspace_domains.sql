-- Persist custom domains per workspace for hosting controls
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkspaceDomainStatus') THEN
    CREATE TYPE "WorkspaceDomainStatus" AS ENUM ('pending', 'verified', 'error');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "workspace_domains" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "domain" varchar(255) NOT NULL,
  "status" "WorkspaceDomainStatus" NOT NULL DEFAULT 'pending',
  "verification_message" text,
  "created_by_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_domains_domain_unique"
  ON "workspace_domains" ("domain");
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_domains_workspace_domain_unique"
  ON "workspace_domains" ("workspace_id", "domain");
CREATE INDEX IF NOT EXISTS "idx_workspace_domains_workspace_id"
  ON "workspace_domains" ("workspace_id");
