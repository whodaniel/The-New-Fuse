-- Encrypted credential vault records for TNF Email Custodian and delegated grants
CREATE TABLE IF NOT EXISTS "agent_managed_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "account_type" varchar(50) NOT NULL,
  "provider" varchar(100) NOT NULL,
  "login_identifier" varchar(255) NOT NULL,
  "encrypted_secret" text NOT NULL,
  "secret_preview" varchar(32),
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" varchar(50) DEFAULT 'active' NOT NULL,
  "created_by_agent" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "agent_managed_accounts_owner_provider_login_uq"
  ON "agent_managed_accounts" ("owner_user_id", "provider", "login_identifier");

CREATE TABLE IF NOT EXISTS "agent_managed_account_grants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "account_id" uuid NOT NULL REFERENCES "agent_managed_accounts"("id") ON DELETE CASCADE,
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "grantee_agent_id" varchar(255) NOT NULL,
  "access_token_hash" text NOT NULL,
  "scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "expires_at" timestamp NOT NULL,
  "revoked" boolean DEFAULT false NOT NULL,
  "last_redeemed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "agent_managed_account_grants_account_idx"
  ON "agent_managed_account_grants" ("account_id");

CREATE INDEX IF NOT EXISTS "agent_managed_account_grants_token_hash_idx"
  ON "agent_managed_account_grants" ("access_token_hash");
