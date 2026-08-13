import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadProviderConfig, type ProviderConfig } from './provider-config.js';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  maxOutput?: number;
  inputCost?: number;
  outputCost?: number;
  features?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Outcome of probing a provider.
 *
 * `unconfigured` and `probe_failed` were previously indistinguishable: both
 * paths in fetchModels() returned `[]`, so a 401, a 429 and "this provider
 * genuinely lists no models" all looked identical to callers. A failover chain
 * cannot route around a failure it cannot see, so the distinction is carried
 * explicitly.
 */
export type ProviderStatus = 'ok' | 'unconfigured' | 'probe_failed';

export interface ModelProvider {
  id: string;
  name: string;
  type: 'api' | 'oauth' | 'local';
  configured: boolean;
  models: ModelInfo[];
  /** Optional so existing consumers keep compiling unchanged. */
  status?: ProviderStatus;
  /** Human-readable reason, populated when status is 'probe_failed'. */
  error?: string;
  /** Resolution order from provider config; lower is preferred. */
  tier?: number;
}

export class ModelsService {
  private modelsCachePath: string;
  private defaultModelPath: string;
  private cacheExpiry: number;
  private providerConfig: ProviderConfig;

  constructor(cachePath?: string) {
    this.modelsCachePath = cachePath || path.join(os.homedir(), '.cache', 'tnf', 'models.json');
    this.defaultModelPath = path.join(os.homedir(), '.config', 'tnf', 'model.default.json');
    // Provider list and resolver tolerances come from ~/.config/tnf/providers.json,
    // falling back to the built-ins. See provider-config.ts.
    this.providerConfig = loadProviderConfig();
    this.cacheExpiry = this.providerConfig.tolerances.cacheExpiryMs;
  }

  /** Warnings raised while loading provider config. Callers should surface these. */
  getConfigWarnings(): string[] {
    return this.providerConfig.warnings;
  }

  /** Where the effective provider list came from, for diagnostics. */
  getConfigSource(): { source: string; path: string } {
    return { source: this.providerConfig.source, path: this.providerConfig.configPath };
  }

  async listProviders(): Promise<ModelProvider[]> {
    const providers: ModelProvider[] = [];

    for (const config of this.providerConfig.providers) {
      if (!config.enabled) continue;

      const apiKey = process.env[config.envKey];
      if (!apiKey) {
        // Absence of a credential is a coverage condition, not a failure.
        providers.push({
          id: config.id,
          name: config.name,
          type: 'api',
          configured: false,
          models: [],
          status: 'unconfigured',
          tier: config.tier,
        });
        continue;
      }

      const probe = await this.fetchModels(config.id, config.baseUrl, apiKey);
      providers.push({
        id: config.id,
        name: config.name,
        type: 'api',
        configured: true,
        models: probe.models,
        status: probe.error ? 'probe_failed' : 'ok',
        ...(probe.error ? { error: probe.error } : {}),
        tier: config.tier,
      });
    }

    return providers;
  }

  async listModels(
    providerId?: string,
    options: { refresh?: boolean; verbose?: boolean } = {}
  ): Promise<ModelInfo[]> {
    if (!options.refresh) {
      const cached = this.loadCache();
      if (
        cached &&
        cached.provider === providerId &&
        Date.now() - cached.timestamp < this.cacheExpiry
      ) {
        return cached.models;
      }
    }

    const providers = await this.listProviders();
    if (providerId) {
      const provider = providers.find((p) => p.id === providerId);
      return provider?.models || [];
    }

    const allModels: ModelInfo[] = [];
    for (const provider of providers) {
      allModels.push(...provider.models);
    }

    this.saveCache(providerId || 'all', allModels);
    return allModels;
  }

  /**
   * Probe a provider's model list.
   *
   * Returns the models alongside an optional `error`. Previously every failure
   * path returned a bare `[]`, which made a dead provider look like an empty
   * one and silently removed it from consideration instead of triggering
   * failover. The probe is also time-boxed: an unbounded fetch against a
   * hanging endpoint would stall every caller of listProviders().
   */
  private async fetchModels(
    providerId: string,
    baseUrl: string,
    apiKey: string
  ): Promise<{ models: ModelInfo[]; error?: string }> {
    const timeoutMs = this.providerConfig.tolerances.fetchTimeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let url: string;
      let headers: Record<string, string>;

      if (providerId === 'google' || providerId === 'gemini') {
        url = `${baseUrl}/models?key=${apiKey}`;
        headers = {};
      } else {
        url = `${baseUrl}/models`;
        headers = { Authorization: `Bearer ${apiKey}` };
      }

      const response = await fetch(url, { headers, signal: controller.signal });
      if (!response.ok) {
        return { models: [], error: `HTTP ${response.status} ${response.statusText}`.trim() };
      }

      const data = (await response.json()) as any;

      if (Array.isArray(data.data)) {
        return {
          models: data.data.map((m: any) => ({
            id: m.id,
            name: m.id,
            provider: providerId,
            contextWindow: m.context_window,
            maxOutput: m.max_output_tokens,
            inputCost: m.pricing?.input ? parseFloat(m.pricing.input) * 1000000 : undefined,
            outputCost: m.pricing?.output ? parseFloat(m.pricing.output) * 1000000 : undefined,
            features: m.features,
          })),
        };
      }

      if (Array.isArray(data.models)) {
        return {
          models: data.models.map((m: any) => ({
            id: m.name.replace('models/', ''),
            name: m.displayName || m.name.replace('models/', ''),
            provider: providerId,
            contextWindow: m.inputTokenLimit,
            maxOutput: m.outputTokenLimit,
            features: m.supportedGenerationMethods,
          })),
        };
      }

      // Reachable, authenticated, but the payload matched no known shape —
      // that is a contract drift worth reporting, not an empty catalogue.
      return { models: [], error: 'unrecognized response shape' };
    } catch (err) {
      const reason =
        (err as Error)?.name === 'AbortError'
          ? `probe timed out after ${timeoutMs}ms`
          : ((err as Error)?.message ?? String(err));
      return { models: [], error: reason };
    } finally {
      clearTimeout(timer);
    }
  }

  private loadCache(): { provider: string; models: ModelInfo[]; timestamp: number } | null {
    if (!fs.existsSync(this.modelsCachePath)) return null;
    try {
      return JSON.parse(fs.readFileSync(this.modelsCachePath, 'utf8'));
    } catch {
      return null;
    }
  }

  private saveCache(provider: string, models: ModelInfo[]): void {
    const dir = path.dirname(this.modelsCachePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      this.modelsCachePath,
      JSON.stringify(
        {
          provider,
          models,
          timestamp: Date.now(),
        },
        null,
        2
      )
    );
  }

  async refreshCache(): Promise<ModelInfo[]> {
    return this.listModels(undefined, { refresh: true });
  }

  async setDefaultModel(
    provider: string,
    model: string
  ): Promise<{ success: boolean; message: string }> {
    const normalizedProvider = provider.trim();
    const normalizedModel = model.trim();
    if (!normalizedProvider || !normalizedModel) {
      return { success: false, message: 'Both provider and model are required' };
    }

    const dir = path.dirname(this.defaultModelPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const payload = {
      provider: normalizedProvider,
      model: normalizedModel,
      updatedAt: Date.now(),
      id: randomUUID(),
    };

    fs.writeFileSync(this.defaultModelPath, JSON.stringify(payload, null, 2));
    process.env.TNF_LLM_MODEL = `${normalizedProvider}/${normalizedModel}`;

    return {
      success: true,
      message: `Default model set to ${normalizedProvider}:${normalizedModel}`,
    };
  }

  async getDefaultModel(): Promise<{ provider: string; model: string }> {
    try {
      if (fs.existsSync(this.defaultModelPath)) {
        const parsed = JSON.parse(fs.readFileSync(this.defaultModelPath, 'utf8')) as {
          provider?: string;
          model?: string;
        };
        if (parsed.provider && parsed.model) {
          return { provider: parsed.provider, model: parsed.model };
        }
      }
    } catch {
      // fall through to env defaults
    }

    const envModel = process.env.TNF_LLM_MODEL || process.env.OPENAI_MODEL || '';
    if (envModel.includes(':')) {
      const [provider, ...rest] = envModel.split(':');
      return { provider, model: rest.join(':') };
    }
    if (envModel.includes('/')) {
      const [provider, ...rest] = envModel.split('/');
      return { provider, model: rest.join('/') };
    }
    if (envModel) {
      return { provider: 'openai', model: envModel };
    }
    return { provider: 'openrouter', model: 'google/gemini-2.0-flash' };
  }
}
