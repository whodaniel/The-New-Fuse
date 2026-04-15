-- Migration: Add OpenCode LLM Configurations
-- Created: 2026-02-16
-- Purpose: Seed database with OpenCode provider configurations (CLI and API)

-- Note: API keys should be set via environment variables, not hardcoded
-- This migration creates the provider records with placeholder API keys

-- ============================================================================
-- OPENCODE API PROVIDER
-- ============================================================================

-- OpenCode API (Server-based)
INSERT INTO llm_configs (
  id,
  name,
  provider,
  model_name,
  api_key,
  api_endpoint,
  is_custom,
  enabled,
  priority,
  retry_config,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'OpenCode API (Sonnet)',
  'opencode',
  'anthropic/claude-sonnet-4-5',
  'OPENCODE_API_KEY_PLACEHOLDER',
  'http://localhost:4096',
  false,
  true,
  5,
  jsonb_build_object(
    'maxAttempts', 3,
    'initialDelay', 1000,
    'maxDelay', 10000,
    'backoffFactor', 2
  ),
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- OpenCode API (Haiku - Fast)
INSERT INTO llm_configs (
  id,
  name,
  provider,
  model_name,
  api_key,
  api_endpoint,
  is_custom,
  enabled,
  priority,
  retry_config,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'OpenCode API (Haiku)',
  'opencode',
  'anthropic/claude-haiku-4-5',
  'OPENCODE_API_KEY_PLACEHOLDER',
  'http://localhost:4096',
  false,
  true,
  6,
  jsonb_build_object(
    'maxAttempts', 3,
    'initialDelay', 1000,
    'maxDelay', 10000,
    'backoffFactor', 2
  ),
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- OPENCODE CLI PROVIDER
-- ============================================================================

-- OpenCode CLI (Sonnet)
INSERT INTO llm_configs (
  id,
  name,
  provider,
  model_name,
  api_key,
  is_custom,
  enabled,
  priority,
  retry_config,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'OpenCode CLI (Sonnet)',
  'opencode-cli',
  'anthropic/claude-sonnet-4-5',
  'opencode',
  false,
  true,
  5,
  jsonb_build_object(
    'maxAttempts', 3,
    'initialDelay', 1000,
    'maxDelay', 10000,
    'backoffFactor', 2
  ),
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- OpenCode CLI (Haiku - Fast)
INSERT INTO llm_configs (
  id,
  name,
  provider,
  model_name,
  api_key,
  is_custom,
  enabled,
  priority,
  retry_config,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'OpenCode CLI (Haiku)',
  'opencode-cli',
  'anthropic/claude-haiku-4-5',
  'opencode',
  false,
  true,
  6,
  jsonb_build_object(
    'maxAttempts', 3,
    'initialDelay', 1000,
    'maxDelay', 10000,
    'backoffFactor', 2
  ),
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PRIORITY EXPLANATION
-- ============================================================================
-- Priority 1: Default provider (reserved for user selection)
-- Priority 2-3: Premium/high-cost providers
-- Priority 4-6: Balanced providers (production workhorses)
-- Priority 7-9: Specialized/fallback providers
-- Priority 10+: Custom/experimental providers

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. For OpenCode API:
--    - Set OPENCODE_BASE_URL to your opencode server URL (default: http://localhost:4096)
--    - Set OPENCODE_SERVER_PASSWORD if your server requires authentication
--    - API keys are managed through OpenCode's /connect command
-- 2. For OpenCode CLI:
--    - Ensure opencode is installed and available in PATH
--    - The api_key field stores the CLI path (default: "opencode")
-- 3. Use LLMProviderService.update() to set real API keys
-- 4. Priority determines fallback order in CostOptimizedRouter
-- 5. Enable/disable providers based on available API keys
