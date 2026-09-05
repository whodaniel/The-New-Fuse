import { describe, expect, it } from 'vitest';
import catalogJson from '../../../../data/providers/catalog.json';
import { LLM_PROVIDERS } from './llmProviders';
import {
  VERIFIED_PROVIDER_CATALOG,
  defaultProviderId,
  modelsForProvider,
} from './verifiedModels';

const catalogProviderIds = (catalogJson as { providers?: { id: string; enabled?: boolean }[] })
  .providers?.filter((p) => p.enabled !== false)
  .map((p) => p.id) ?? [];

describe('verifiedModels (offline fallback catalog)', () => {
  it('covers EVERY canonical registry provider — no silent drift', () => {
    const entryIds = VERIFIED_PROVIDER_CATALOG.map((p) => p.id);
    for (const id of catalogProviderIds) {
      expect(entryIds, `registry provider "${id}" missing from offline fallback`).toContain(id);
    }
    expect(entryIds.length).toBeGreaterThanOrEqual(catalogProviderIds.length);
  });

  it('stays in sync with the llmProviders registry ids', () => {
    for (const provider of LLM_PROVIDERS) {
      expect(VERIFIED_PROVIDER_CATALOG.some((p) => p.id === provider.id)).toBe(true);
    }
  });

  it('does not list providers outside the registry except desktop-only surfaces', () => {
    const desktopOnly = new Set(['chrome-ai', 'google-gemma', 'edge-slm']);
    const registryIds = new Set(LLM_PROVIDERS.map((p) => p.id));
    for (const entry of VERIFIED_PROVIDER_CATALOG) {
      expect(
        registryIds.has(entry.id) || desktopOnly.has(entry.id),
        `"${entry.id}" is neither registry nor desktop-only`
      ).toBe(true);
    }
    // Cerebras was removed: not in the canonical registry.
    expect(VERIFIED_PROVIDER_CATALOG.some((p) => p.id === 'cerebras')).toBe(false);
  });

  it('keeps the NVIDIA-first default', () => {
    expect(VERIFIED_PROVIDER_CATALOG[0]?.id).toBe('nvidia');
    expect(defaultProviderId()).toBe('nvidia');
  });

  it('uses catalog bytes for providers with inline models', () => {
    const nvidia = VERIFIED_PROVIDER_CATALOG.find((p) => p.id === 'nvidia');
    expect(nvidia?.models.length).toBeGreaterThan(50);
    expect(nvidia?.models).toContain('openai/gpt-oss-120b');

    const google = VERIFIED_PROVIDER_CATALOG.find((p) => p.id === 'google');
    expect(google?.models).toContain('gemini-3.7-flash');

    const anthropic = VERIFIED_PROVIDER_CATALOG.find((p) => p.id === 'anthropic');
    expect(anthropic?.models.length).toBeGreaterThan(0);

    const openai = VERIFIED_PROVIDER_CATALOG.find((p) => p.id === 'openai');
    expect(openai?.models.length).toBeGreaterThan(0);
  });

  it('carries curated fallbacks only where the catalog has no inline models', () => {
    const aihubmix = VERIFIED_PROVIDER_CATALOG.find((p) => p.id === 'aihubmix');
    expect(aihubmix?.models[0]).toBe('coding-glm-5.3');

    const deepseek = VERIFIED_PROVIDER_CATALOG.find((p) => p.id === 'deepseek');
    expect(deepseek?.models).toContain('deepseek-chat');

    const openrouter = VERIFIED_PROVIDER_CATALOG.find((p) => p.id === 'openrouter');
    expect(openrouter?.models.length).toBeGreaterThan(0);
  });

  it('keeps the desktop-only on-device surfaces', () => {
    expect(modelsForProvider('chrome-ai')).toContain('gemini-nano-prompt-api');
    expect(modelsForProvider('google-gemma')).toContain('gemma-3-27b');
    expect(modelsForProvider('edge-slm')).toContain('phi-4-mini');
  });

  it('has unique ids, non-empty names and duplicate-free model lists', () => {
    const ids = VERIFIED_PROVIDER_CATALOG.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of VERIFIED_PROVIDER_CATALOG) {
      expect(entry.name.trim().length).toBeGreaterThan(0);
      expect(new Set(entry.models).size).toBe(entry.models.length);
    }
  });

  it('returns an empty model list for unknown providers', () => {
    expect(modelsForProvider('nonexistent-provider')).toEqual([]);
  });
});
