-- Align workflow_executions with Drizzle schema used by GET /api/workflows.
-- Idempotent. Safe to re-run.
--
-- Observed prod drift (2026-08-12):
--   table existed but lacked node_executions/context/logs/statistics/metadata
-- Symptom: GET /api/workflows → 500 Failed query

ALTER TABLE "workflow_executions"
  ADD COLUMN IF NOT EXISTS "node_executions" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "context" jsonb,
  ADD COLUMN IF NOT EXISTS "logs" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "statistics" jsonb,
  ADD COLUMN IF NOT EXISTS "metadata" jsonb;
