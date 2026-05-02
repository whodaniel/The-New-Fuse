DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'agent_registrations'
      AND column_name = 'auth_token'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'agent_registrations'
      AND column_name = 'encrypted_auth_token'
  ) THEN
    EXECUTE 'ALTER TABLE "agent_registrations" RENAME COLUMN "auth_token" TO "encrypted_auth_token"';
  END IF;
END
$$;
--> statement-breakpoint
ALTER TABLE "agent_registrations"
  ALTER COLUMN "encrypted_auth_token" TYPE varchar(1024);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'agent_registrations'
      AND constraint_name = 'agent_registrations_auth_token_unique'
  ) THEN
    EXECUTE 'ALTER TABLE "agent_registrations" RENAME CONSTRAINT "agent_registrations_auth_token_unique" TO "agent_registrations_encrypted_auth_token_unique"';
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'agent_registrations'
      AND constraint_name = 'agent_registrations_encrypted_auth_token_unique'
  ) THEN
    EXECUTE 'ALTER TABLE "agent_registrations" ADD CONSTRAINT "agent_registrations_encrypted_auth_token_unique" UNIQUE ("encrypted_auth_token")';
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'prompt_versions'
      AND column_name = 'version'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'prompt_versions'
      AND column_name = 'version_number'
  ) THEN
    EXECUTE 'ALTER TABLE "prompt_versions" RENAME COLUMN "version" TO "version_number"';
  END IF;
END
$$;
--> statement-breakpoint
ALTER TABLE "prompt_versions"
  ADD COLUMN IF NOT EXISTS "name" varchar(255);
--> statement-breakpoint
ALTER TABLE "prompt_versions"
  ALTER COLUMN "label" TYPE varchar(50);
--> statement-breakpoint
ALTER TABLE "prompt_versions"
  ALTER COLUMN "label" SET DEFAULT 'development';
--> statement-breakpoint
ALTER TABLE "prompt_versions"
  ALTER COLUMN "variables" SET DEFAULT '{}'::jsonb;
--> statement-breakpoint
UPDATE "prompt_versions"
SET "variables" = '{}'::jsonb
WHERE "variables" IS NULL;
--> statement-breakpoint
ALTER TABLE "prompt_versions"
  ALTER COLUMN "variables" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "prompt_versions"
  ADD COLUMN IF NOT EXISTS "blocks" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "prompt_versions"
  ALTER COLUMN "metrics" SET DEFAULT '{"successRate":0,"totalRuns":0,"avgResponseTime":0}'::jsonb;
--> statement-breakpoint
ALTER TABLE "prompt_versions"
  ADD COLUMN IF NOT EXISTS "created_by" varchar(255);
