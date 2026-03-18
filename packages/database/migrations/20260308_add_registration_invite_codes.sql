-- Invite-only registration support
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InviteCodeStatus') THEN
    CREATE TYPE "InviteCodeStatus" AS ENUM ('ACTIVE', 'DISABLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "registration_invite_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(128) NOT NULL UNIQUE,
  "label" varchar(255),
  "federation_id" varchar(255),
  "status" "InviteCodeStatus" NOT NULL DEFAULT 'ACTIVE',
  "max_uses" integer NOT NULL DEFAULT 1,
  "used_count" integer NOT NULL DEFAULT 0,
  "expires_at" timestamp,
  "last_used_at" timestamp,
  "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_registration_invite_codes_status" ON "registration_invite_codes" ("status");
CREATE INDEX IF NOT EXISTS "idx_registration_invite_codes_expires_at" ON "registration_invite_codes" ("expires_at");
