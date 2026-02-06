import type { ModelDefinitionConfig, ModelProviderConfig } from '../config/types.js';

export const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai';

export const PERPLEXITY_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
};

export const PERPLEXITY_MODEL_CATALOG = [
  {
    id: 'sonar',
    name: 'Perplexity Sonar',
    reasoning: false,
    input: ['text'],
    contextWindow: 127072,
    maxTokens: 4096,
  },
  {
    id: 'sonar-pro',
    name: 'Perplexity Sonar Pro',
    reasoning: false,
    input: ['text'],
    contextWindow: 200000,
    maxTokens: 8192,
  },
  {
    id: 'sonar-reasoning',
    name: 'Perplexity Sonar Reasoning',
    reasoning: true,
    input: ['text'],
    contextWindow: 127072,
    maxTokens: 4096,
  },
  {
    id: 'sonar-reasoning-pro',
    name: 'Perplexity Sonar Reasoning Pro',
    reasoning: true,
    input: ['text'],
    contextWindow: 200000,
    maxTokens: 8192,
  },
  {
    id: 'r1-1776',
    name: 'Perplexity R1 1776',
    reasoning: true,
    input: ['text'],
    contextWindow: 128000,
    maxTokens: 16384,
  },
] as const;

export function buildPerplexityModelDefinition(
  entry: (typeof PERPLEXITY_MODEL_CATALOG)[number]
): ModelDefinitionConfig {
  return {
    id: entry.id,
    name: entry.name,
    reasoning: entry.reasoning,
    input: [...entry.input] as ('text' | 'image')[],
    cost: PERPLEXITY_DEFAULT_COST,
    contextWindow: entry.contextWindow,
    maxTokens: entry.maxTokens,
  };
}

export function buildPerplexityProvider(): ModelProviderConfig {
  return {
    baseUrl: PERPLEXITY_BASE_URL,
    api: 'openai-completions',
    models: PERPLEXITY_MODEL_CATALOG.map(buildPerplexityModelDefinition),
  };
}
