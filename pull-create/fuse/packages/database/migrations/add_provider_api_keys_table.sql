-- Per-user provider API key storage (encrypted at application layer)
CREATE TABLE IF NOT EXISTS "provider_api_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" varchar(100) NOT NULL,
  "encrypted_key" text NOT NULL,
  "key_preview" varchar(32),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "provider_api_keys_user_provider_uq"
  ON "provider_api_keys" ("user_id", "provider");

