import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROVIDER_NAME,
  FALLBACK_PROVIDER_NONE,
  LLM_PROVIDER_ENV_KEYS,
  LLM_PROVIDERS,
  resolveProviderName,
  USER_LAYER_PROVIDERS,
} from './llmProviders';

describe('llmProviders', () => {
  it('exposes the full canonical catalog, not a hand-picked subset', () => {
    const ids = LLM_PROVIDERS.map((p) => p.id);
    for (const required of [
      'ollama',
      'llamacpp',
      'google',
      'groq',
      'aihubmix',
      'nvidia',
      'deepseek',
      'openrouter',
      'togetherai',
      'fireworksai',
      'perplexity',
      'cohere',
      'mistral',
      'xai',
      'sambanova',
      'qwen',
      'novita',
      'moonshot',
      'anthropic',
      'openai',
      'lmstudio',
      'localai',
      'textgenwebui',
    ]) {
      expect(ids, `provider "${required}" missing from Settings registry`).toContain(required);
    }
    expect(LLM_PROVIDERS.length).toBeGreaterThanOrEqual(23);
  });

  it('carries the user-layer aihubmix override with its credential env', () => {
    const aihubmix = LLM_PROVIDERS.find((p) => p.id === 'aihubmix');
    expect(aihubmix).toBeDefined();
    expect(aihubmix?.name).toBe('AIHubMix');
    expect(aihubmix?.envKey).toBe('AIHUBMIX_API_KEY');
    expect(aihubmix?.userLayer).toBe(true);
    expect(USER_LAYER_PROVIDERS.map((p) => p.id)).toContain('aihubmix');
  });

  it('has unique ids and unique display names', () => {
    const ids = LLM_PROVIDERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = LLM_PROVIDERS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      expect(name.trim().length).toBeGreaterThan(0);
    }
  });

  it('is sorted by tier so cloud defaults float above local fallbacks', () => {
    const tiers = LLM_PROVIDERS.map((p) => p.tier ?? 999);
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
  });

  it('keeps NVIDIA NIM spelled exactly as the stored default state expects', () => {
    const nvidia = LLM_PROVIDERS.find((p) => p.id === 'nvidia');
    expect(nvidia?.name).toBe('NVIDIA NIM');
  });

  it('derives the env-key hint list from the same registry', () => {
    expect(LLM_PROVIDER_ENV_KEYS).toContain('AIHUBMIX_API_KEY');
    expect(LLM_PROVIDER_ENV_KEYS).toContain('NVIDIA_API_KEY');
  });

  it('keeps the fallback none sentinel stable', () => {
    expect(FALLBACK_PROVIDER_NONE).toBe('None');
  });

  describe('resolveProviderName', () => {
    it('accepts every registry display name', () => {
      for (const provider of LLM_PROVIDERS) {
        expect(resolveProviderName(provider.name)).toBe(provider.name);
      }
    });

    it('falls back to the catalog default for stale persisted names', () => {
      expect(resolveProviderName('Cerebras')).toBe(DEFAULT_PROVIDER_NAME);
      expect(resolveProviderName('Google Gemini')).toBe(DEFAULT_PROVIDER_NAME);
      expect(resolveProviderName('')).toBe(DEFAULT_PROVIDER_NAME);
      expect(resolveProviderName(undefined)).toBe(DEFAULT_PROVIDER_NAME);
    });

    it('allows None only when the caller permits it (fallback select)', () => {
      expect(resolveProviderName(FALLBACK_PROVIDER_NONE, true)).toBe(FALLBACK_PROVIDER_NONE);
      expect(resolveProviderName(FALLBACK_PROVIDER_NONE)).toBe(DEFAULT_PROVIDER_NAME);
    });
  });
});
