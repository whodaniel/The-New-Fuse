-- Encrypted account vault for remote TNF agents (secret encrypted at application layer)
CREATE TABLE IF NOT EXISTS "agent_managed_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "account_type" varchar(100) NOT NULL,
  "provider" varchar(100) NOT NULL,
  "username" varchar(320) NOT NULL,
  "encrypted_secret" text NOT NULL,
  "secret_preview" varchar(32),
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by_agent_id" varchar(255),
  "last_issued_to_agent_id" varchar(255),
  "last_issued_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "agent_managed_accounts_owner_provider_username_uq"
  ON "agent_managed_accounts" ("owner_user_id", "provider", "username");

CREATE INDEX IF NOT EXISTS "agent_managed_accounts_owner_account_type_idx"
  ON "agent_managed_accounts" ("owner_user_id", "account_type");
