-- Migration: Add Anthropic and Gemini LLM Configurations
-- Created: 2026-01-17
-- Purpose: Seed database with default Anthropic Claude and Google Gemini provider configurations

-- Note: API keys should be set via environment variables, not hardcoded
-- This migration creates the provider records with placeholder API keys

-- ============================================================================
-- ANTHROPIC CLAUDE PROVIDERS
-- ============================================================================

-- Claude 3.5 Sonnet (Balanced - Production Default)
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
  'Claude 3.5 Sonnet',
  'anthropic',
  'claude-3-5-sonnet-20241022',
  'ANTHROPIC_API_KEY_PLACEHOLDER', -- Replace via environment variable
  NULL, -- Uses default Anthropic endpoint
  false,
  true,
  5, -- Medium priority
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

-- Claude 3.5 Haiku (Fast - Cost Optimized)
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
  'Claude 3.5 Haiku',
  'anthropic',
  'claude-3-5-haiku-20241022',
  'ANTHROPIC_API_KEY_PLACEHOLDER',
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

-- Claude 3 Opus (Most Capable - Premium)
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
  'Claude 3 Opus',
  'anthropic',
  'claude-3-opus-20240229',
  'ANTHROPIC_API_KEY_PLACEHOLDER',
  false,
  true,
  8, -- Lower priority (higher cost)
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
-- GOOGLE GEMINI PROVIDERS
-- ============================================================================

-- Gemini 2.0 Flash (Fastest - Production Default)
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
  'Gemini 2.0 Flash',
  'gemini',
  'gemini-2.0-flash-exp',
  'GEMINI_API_KEY_PLACEHOLDER', -- Replace via environment variable
  false,
  true,
  4, -- High priority (fast + cheap)
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

-- Gemini 1.5 Pro (Most Capable - Extended Context)
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
  'Gemini 1.5 Pro',
  'gemini',
  'gemini-1.5-pro-latest',
  'GEMINI_API_KEY_PLACEHOLDER',
  false,
  true,
  7, -- Medium-low priority (2M context, higher cost)
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

-- Gemini 1.5 Flash (Balanced)
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
  'Gemini 1.5 Flash',
  'gemini',
  'gemini-1.5-flash-latest',
  'GEMINI_API_KEY_PLACEHOLDER',
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
-- 1. API keys must be updated via environment variables or admin UI
-- 2. The PLACEHOLDER values will trigger errors if used directly
-- 3. Use LLMProviderService.update() to set real API keys
-- 4. Priority determines fallback order in CostOptimizedRouter
-- 5. Enable/disable providers based on available API keys
