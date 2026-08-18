-- Registry of user-owned storage locations. Stores pointers and consent state,
-- never OAuth tokens or raw file contents.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserDataLocationProvider') THEN
    CREATE TYPE "UserDataLocationProvider" AS ENUM (
      'google_drive',
      'dropbox',
      'box',
      'onedrive',
      'customer_s3_or_r2',
      'private_github_repo',
      'local_device_reference',
      'other_url'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserDataLocationKind') THEN
    CREATE TYPE "UserDataLocationKind" AS ENUM (
      'document_library',
      'media_library',
      'exports',
      'backups',
      'project_assets',
      'generated_outputs',
      'client_artifacts',
      'personal_business_artifacts'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserDataClassification') THEN
    CREATE TYPE "UserDataClassification" AS ENUM (
      'personal',
      'business',
      'client',
      'confidential',
      'public'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserDataLocationConsentStatus') THEN
    CREATE TYPE "UserDataLocationConsentStatus" AS ENUM (
      'active',
      'pending',
      'revoked',
      'expired'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserDataLocationSyncStatus') THEN
    CREATE TYPE "UserDataLocationSyncStatus" AS ENUM (
      'active',
      'paused',
      'reauth_required',
      'disconnected',
      'deleted'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "user_data_locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id" text REFERENCES "workspaces"("id") ON DELETE SET NULL,
  "project_id" text REFERENCES "projects"("id") ON DELETE SET NULL,
  "provider" "UserDataLocationProvider" NOT NULL,
  "location_kind" "UserDataLocationKind" NOT NULL,
  "provider_account_label" varchar(255),
  "external_location_id" varchar(512),
  "external_url" text,
  "root_path_hint" text,
  "data_classification" "UserDataClassification" NOT NULL DEFAULT 'business',
  "consent_status" "UserDataLocationConsentStatus" NOT NULL DEFAULT 'pending',
  "sync_status" "UserDataLocationSyncStatus" NOT NULL DEFAULT 'paused',
  "oauth_secret_ref" varchar(255),
  "retention_policy" varchar(120),
  "hash_and_provenance_metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "last_indexed_at" timestamp,
  "last_verified_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "user_data_locations_pointer_required"
    CHECK (
      "external_location_id" IS NOT NULL
      OR "external_url" IS NOT NULL
      OR "root_path_hint" IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS "user_data_locations_user_idx"
  ON "user_data_locations" ("user_id");
CREATE INDEX IF NOT EXISTS "user_data_locations_workspace_idx"
  ON "user_data_locations" ("workspace_id");
CREATE INDEX IF NOT EXISTS "user_data_locations_project_idx"
  ON "user_data_locations" ("project_id");
CREATE INDEX IF NOT EXISTS "user_data_locations_provider_status_idx"
  ON "user_data_locations" ("provider", "consent_status", "sync_status");
CREATE INDEX IF NOT EXISTS "user_data_locations_verification_idx"
  ON "user_data_locations" ("last_verified_at");
CREATE UNIQUE INDEX IF NOT EXISTS "user_data_locations_external_location_uq"
  ON "user_data_locations" ("user_id", "provider", "external_location_id")
  WHERE "external_location_id" IS NOT NULL;
