-- 0008_add_user_active_agents.sql
-- Phase 5 (audit 2026-06-14): denormalized activeAgentIds[] + agentQualities{}
-- on users table for hot-path queries ("what is this user running right now").
-- Source of truth is still the agents table (joined on userId); this is a cache.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "active_agent_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "agent_qualities"   jsonb DEFAULT '{}'::jsonb NOT NULL;

-- Index for hot-path "user X's active agents" query.
CREATE INDEX IF NOT EXISTS "users_active_agent_ids_gin_idx"
  ON "users" USING GIN ("active_agent_ids");
