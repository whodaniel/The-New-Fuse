-- Align production agents table with Drizzle schema used by api-server.
-- Idempotent. Safe to re-run.
--
-- Observed prod drift (2026-08-12):
--   * `qualities` never renamed to `traits` (0014 not applied)
--   * `profile` jsonb missing entirely (never migrated)
--
-- Symptoms: GET /api/agents → 400 Failed query selecting profile/traits.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'qualities'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'traits'
  ) THEN
    ALTER TABLE "agents" RENAME COLUMN "qualities" TO "traits";
  END IF;
END$$;

ALTER TABLE "agents"
  ADD COLUMN IF NOT EXISTS "traits" jsonb DEFAULT '{}'::jsonb NOT NULL;

ALTER TABLE "agents"
  ADD COLUMN IF NOT EXISTS "profile" jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS "agents_traits_gin_idx"
  ON "agents" USING GIN ("traits");
