-- 0009_align_agent_definition_vocabulary.sql
-- Phase 8 (consistency review 2026-06-14): align role+qualities vocabulary
-- with the canonical runtime terminology surfaced by `tnf traits list` and
-- DACC-v1 ROLE_DEFINITIONS.
--
-- Strategy:
--   * Keep the existing role enum (now semantically 'worker_action').
--     We DO NOT drop the column; we leave 'role' as a backward-compatible alias
--     that downstream queries can still read.
--   * Add a NEW 'dacc_role' enum with DACC-v1 values: director, orchestrator,
--     broker, worker, participant. Default 'worker' so existing rows classify
--     without intervention.
--   * Rename qualities -> traits at the jsonb level. We do this with a safe
--     data migration that preserves any existing data (no-op since column
--     was just added in 0006 and is mostly empty).
--   * Update DB comments are not standards but we embed documentation in the
--     JSONB shape.
--
-- This migration is idempotent and additive. No DROP statements.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DaccRole') THEN
    CREATE TYPE "DaccRole" AS ENUM (
      'director',
      'orchestrator',
      'broker',
      'worker',
      'participant'
    );
  END IF;
END$$;

-- Add dacc_role column (default 'worker' is safe; existing rows classify).
ALTER TABLE "agents"
  ADD COLUMN IF NOT EXISTS "dacc_role" "DaccRole" DEFAULT 'worker' NOT NULL;

-- Rename qualities -> traits (rename if qualities exists and traits does not;
-- if both exist somehow, do nothing — manual reconciliation needed).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'qualities'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'traits'
  ) THEN
    ALTER TABLE "agents" RENAME COLUMN "qualities" TO "traits";
  END IF;
END$$;

-- Add traits backfill for any rows that lack it (forward-compat).
ALTER TABLE "agents"
  ADD COLUMN IF NOT EXISTS "traits" jsonb DEFAULT '{}'::jsonb NOT NULL;

-- Indexes for common dispatch queries
CREATE INDEX IF NOT EXISTS "agents_dacc_role_idx"
  ON "agents" ("dacc_role");

-- GIN index for traits (jsonb hot-path: traits @> '{...}')
CREATE INDEX IF NOT EXISTS "agents_traits_gin_idx"
  ON "agents" USING GIN ("traits");

-- Documentation of canonical axes (commented, not executed):
--
-- An agent row's identity is now composed of three orthogonal axes:
--
--   1. dacc_role (DaccRole enum)        — DACC-v1 hierarchy position:
--      director|orchestrator|broker|worker|participant
--   2. worker_action (AgentRole enum)   — what kind of work this agent does,
--      formerly called `role`. Examples: code_generation, cli_coder, ...
--   3. fulfillment (jsonb)              — runtime stack:
--      { vendor, model, transport, protocol_version, prompt_doc_uri, tools,
--        endpoint, raw }
--
-- Plus orthogonal:
--
--   4. traits (jsonb)                   — observability, autonomy, persona
--      source, subAgent_capable, orchestrates_agents, etc.
--   5. platform (string, legacy field)  — coarse agent-platform label,
--      broader than fulfillment.vendor; chosen from PLATFORM_TAXONOMY in
--      packages/tnf-cli/src/cli.ts
--
-- `qulities` and `qualities` are no longer used. Downstream readers should
-- migrate to read from `traits` directly.
