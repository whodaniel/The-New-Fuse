-- 0006_add_agent_role_fulfillment.sql
-- Phase 1 of agent-classification audit (2026-06-14)
-- Splits role and fulfillment (model+tools+prompting) into separate fields,
-- independent of the legacy agentTypeEnum which conflates role/platform/product.
--
-- Additive, backward-compatible:
--   - new column `role` (nullable, AgentRole enum)
--   - new column `fulfillment` (jsonb, free-form; recommended shape documented in AGENTS.md)
--   - new enum type AgentRole (action-typed primitives, NOT a product catalog)
--   - new column `qualities` (jsonb) per audit operator directive
--   - existing `type` column retained for backward compat
--
-- Owners of Phase 2 (in-memory registry) and Phase 3 (broker) read these.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgentRole') THEN
    CREATE TYPE "AgentRole" AS ENUM (
      -- conversation primitives
      'conversational',
      'assistant',
      'analysis',
      -- code primitives
      'code_generation',
      'code_review',
      'code_refactor',
      'code_test',
      'code_debug',
      'code_architect',
      'code_optimizer',
      'code_security',
      'code_migration',
      'code_documentation',
      -- orchestration primitives
      'orchestrator',
      'broker',
      'router',
      'monitor',
      'validator',
      'scheduler',
      'gateway',
      'director',
      'coordinator',
      'handoff',
      'cleanup',
      -- execution primitives
      'workflow',
      'task',
      'cli_coder',
      'cli_debugger',
      'cli_devops',
      'cli_database',
      'cli_git',
      'cli_shell',
      'cli_research',
      'cli_qa',
      -- research / knowledge
      'research_web',
      'research_academic',
      'research_market',
      -- data primitives
      'data_analyst',
      'data_engineer',
      'data_scientist',
      -- infrastructure primitives
      'infra_devops',
      'infra_cloud',
      'infra_kubernetes',
      'infra_docker',
      'infra_terraform',
      'infra_monitoring',
      -- communication primitives
      'comm_translator',
      'comm_summarizer',
      'comm_writer',
      'comm_email',
      'comm_slack',
      'comm_discord',
      -- TNF framework
      'tnf_core',
      'tnf_onboarding',
      'tnf_heartbeat',
      -- generic / fallback
      'basic',
      'unknown'
    );
  END IF;
END$$;

ALTER TABLE "agents"
  ADD COLUMN IF NOT EXISTS "role" "AgentRole",
  ADD COLUMN IF NOT EXISTS "fulfillment" jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "qualities"  jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "fulfillment_updated_at" timestamp;

-- Indexes for hot-path queries
CREATE INDEX IF NOT EXISTS "agents_role_idx"
  ON "agents" ("role");
CREATE INDEX IF NOT EXISTS "agents_fulfillment_vendor_idx"
  ON "agents" ((fulfillment->>'vendor'));
CREATE INDEX IF NOT EXISTS "agents_fulfillment_model_idx"
  ON "agents" ((fulfillment->>'model'));

-- GIN index for qualities (jsonb queries like qualities @> '{...}')
CREATE INDEX IF NOT EXISTS "agents_qualities_gin_idx"
  ON "agents" USING GIN ("qualities");

-- Documented shape (not enforced by Postgres type, but documented for callers):
--
-- fulfillment: {
--   vendor: string,           -- 'kilo' | 'opencode' | 'claude-code' | 'jules' | 'tnf-hermes' | 'pi' | 'hermes' | ...
--   model: string,            -- e.g. 'nvidia/minimaxai/minimax-m3', 'kilo-gateway/qwen3-coder', ...
--   transport: string,        -- 'stdio' | 'http' | 'websocket' | 'browser-extension' | 'ide'
--   protocol_version: string, -- semver-ish; version of the agent-protocol this fulfillment speaks
--   prompt_doc_uri: string,   -- file://, repo://, https://... points at the system-prompt/persona doc
--   tools: string[],          -- list of tool identifiers this fulfillment has access to
--   endpoint?: string,        -- optional transport endpoint (e.g. ws://localhost:7788 for hermes)
--   raw?: jsonb               -- vendor-specific extension fields, opaque to TNF
-- }

-- qualities: {
--   observability: 'native' | 'mirrored' | 'opaque',
--   subAgent_capable: boolean,
--   orchestrates_agents: boolean,
--   persona_source: 'self' | 'tnf' | 'platform' | 'fixed',
--   autonomy_level: 'supervised' | 'semiautonomous' | 'autonomous',
--   description?: string,
--   raw?: jsonb
-- }
