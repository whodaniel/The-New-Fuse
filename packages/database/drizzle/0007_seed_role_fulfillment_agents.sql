-- 0007_seed_role_fulfillment_agents.sql
-- Phase 4 (audit 2026-06-14): extend AgentType enum + seed canonical external
-- agent-role+fulfillment pairs so kilo, opencode, pi, claude-code, hermes, jules
-- have first-class identity in the registry.
--
-- Idempotent: uses IF NOT EXISTS / INSERT ... ON CONFLICT DO NOTHING.
-- Seed entries require a default SYSTEM user. If absent, we create one. We do
-- NOT overwrite user-supplied agents (the ON CONFLICT clause targets the
-- unique (user_id, name) tuple).

-- 1) Extend AgentType enum (Postgres requires ALTER TYPE ... ADD VALUE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'CLI_KILO'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AgentType')
  ) THEN
    ALTER TYPE "AgentType" ADD VALUE 'CLI_KILO';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'CLI_OPENCODE'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AgentType')
  ) THEN
    ALTER TYPE "AgentType" ADD VALUE 'CLI_OPENCODE';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'CLI_PI'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AgentType')
  ) THEN
    ALTER TYPE "AgentType" ADD VALUE 'CLI_PI';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'API_CLAUDE_CODE'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AgentType')
  ) THEN
    ALTER TYPE "AgentType" ADD VALUE 'API_CLAUDE_CODE';
  END IF;
END$$;

-- 2) Ensure a SYSTEM user exists for seeded entries.
-- We only seed against the SYSTEM user, so existing per-user agents stay intact.
INSERT INTO "users" (id, email, username, name, role, roles, is_active, hashed_password)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system@thenewfuse.local',
  'tnf_system',
  'TNF System',
  'SUPER_ADMIN',
  '["USER","ADMIN","SUPER_ADMIN"]'::jsonb,
  true,
  '!SEED-NO-LOGIN'
)
ON CONFLICT (email) DO NOTHING;

-- 3) Index used by the seeder's ON CONFLICT guard.
CREATE UNIQUE INDEX IF NOT EXISTS "agents_user_id_name_uq_seed"
  ON "agents" ("user_id", "name");
