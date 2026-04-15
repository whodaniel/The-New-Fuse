-- Scoped delegated API access for agents without exposing provider keys
CREATE TABLE IF NOT EXISTS "agent_api_grants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "agent_id" varchar(255) NOT NULL,
  "provider" varchar(100) NOT NULL,
  "allowed_models" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "max_requests_per_minute" integer NOT NULL DEFAULT 30,
  "daily_token_budget" integer NOT NULL DEFAULT 200000,
  "monthly_usd_cap_cents" integer NOT NULL DEFAULT 1000,
  "expires_at" timestamp NOT NULL,
  "revoked" boolean NOT NULL DEFAULT false,
  "token_version" integer NOT NULL DEFAULT 1,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_agent_api_grants_user_id" ON "agent_api_grants" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_agent_api_grants_provider" ON "agent_api_grants" ("provider");
CREATE INDEX IF NOT EXISTS "idx_agent_api_grants_active" ON "agent_api_grants" ("revoked", "expires_at");

CREATE TABLE IF NOT EXISTS "agent_api_grant_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "grant_id" uuid NOT NULL REFERENCES "agent_api_grants"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "agent_id" varchar(255) NOT NULL,
  "provider" varchar(100) NOT NULL,
  "model" varchar(255),
  "prompt_tokens" integer NOT NULL DEFAULT 0,
  "completion_tokens" integer NOT NULL DEFAULT 0,
  "total_tokens" integer NOT NULL DEFAULT 0,
  "estimated_cost_cents" integer NOT NULL DEFAULT 0,
  "status_code" integer NOT NULL,
  "duration_ms" integer NOT NULL DEFAULT 0,
  "error" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_agent_api_grant_usage_grant_time"
  ON "agent_api_grant_usage" ("grant_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_agent_api_grant_usage_user_time"
  ON "agent_api_grant_usage" ("user_id", "created_at");

