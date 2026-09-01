import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadProviderConfig, type ProviderConfig, type ProviderDef } from './provider-config.js';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  maxOutput?: number;
  inputCost?: number;
  outputCost?: number;
  features?: string[];
  source?: 'live' | 'catalog' | 'cache';
  metadata?: Record<string, unknown>;
}

export type ProviderStatus = 'ok' | 'catalog_only' | 'unconfigured' | 'probe_failed';

export interface ModelProvider {
  id: string;
  name: string;
  type: 'api' | 'oauth' | 'local';
  configured: boolean;
  models: ModelInfo[];
  status?: ProviderStatus;
  error?: string;
  tier?: number;
  defaultModel?: string;
  /** Credential variable actually selected; never contains credential material. */
  credentialEnv?: string;
  discovery: 'live' | 'catalog';
}

export interface ListProviderOptions {
  /** Probe provider APIs. False returns the catalog immediately for menus. */
  probe?: boolean;
}

interface ProviderProbe {
  models: ModelInfo[];
  error?: string;
}

function numberOrUndefined(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function pricePerMillion(value: unknown): number | undefined {
  const parsed = numberOrUndefined(value);
  return parsed === undefined ? undefined : parsed * 1_000_000;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((item): item is string => typeof item === 'string');
  return strings.length ? strings : undefined;
}

/** Normalize OpenAI-compatible, Google, Anthropic, Cohere, Ollama and Mistral
 * model records into one menu-safe shape. */
export function normalizeDiscoveredModel(raw: unknown, provider: string): ModelInfo | null {
  if (typeof raw === 'string') {
    return { id: raw, name: raw, provider, source: 'live' };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Record<string, any>;
  const resourceName = row.id ?? row.model ?? row.name;
  if (typeof resourceName !== 'string' || !resourceName.trim()) return null;
  const id = resourceName.replace(/^models\//, '');
  const nameCandidate = row.display_name ?? row.displayName ?? row.name ?? row.model ?? row.id;
  const capabilities =
    row.capabilities && typeof row.capabilities === 'object'
      ? Object.entries(row.capabilities)
          .filter(
            ([, value]) =>
              value === true ||
              (value && typeof value === 'object' && (value as { supported?: boolean }).supported)
          )
          .map(([key]) => key)
      : undefined;

  return {
    id,
    name: typeof nameCandidate === 'string' ? nameCandidate.replace(/^models\//, '') : id,
    provider,
    contextWindow: numberOrUndefined(
      row.context_window,
      row.context_length,
      row.max_context_length,
      row.inputTokenLimit,
      row.max_input_tokens,
      row.details?.context_length
    ),
    maxOutput: numberOrUndefined(
      row.max_output_tokens,
      row.max_completion_tokens,
      row.outputTokenLimit,
      row.max_tokens,
      row.top_provider?.max_completion_tokens
    ),
    inputCost: pricePerMillion(row.pricing?.input ?? row.pricing?.prompt),
    outputCost: pricePerMillion(row.pricing?.output ?? row.pricing?.completion),
    features:
      stringArray(row.features) ??
      stringArray(row.supported_parameters) ??
      stringArray(row.supportedGenerationMethods) ??
      stringArray(row.endpoints) ??
      capabilities,
    source: 'live',
    metadata: {
      ...(row.owned_by ? { ownedBy: row.owned_by } : {}),
      ...((row.created ?? row.created_at) ? { created: row.created ?? row.created_at } : {}),
      ...(row.description ? { description: row.description } : {}),
    },
  };
}

function modelsFromPayload(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.models)) return data.models;
  if (Array.isArray(data.model_list)) return data.model_list;
  return null;
}

function mergeModels(primary: ModelInfo[], fallback: ModelInfo[]): ModelInfo[] {
  const byId = new Map<string, ModelInfo>();
  for (const model of [...primary, ...fallback]) {
    if (!byId.has(model.id)) byId.set(model.id, model);
  }
  return [...byId.values()];
}

export class ModelsService {
  private modelsCachePath: string;
  private defaultModelPath: string;
  private cacheExpiry: number;
  private providerConfig: ProviderConfig;

  constructor(cachePath?: string) {
    this.modelsCachePath = cachePath || path.join(os.homedir(), '.cache', 'tnf', 'models.json');
    this.defaultModelPath = path.join(os.homedir(), '.config', 'tnf', 'model.default.json');
    this.providerConfig = loadProviderConfig();
    this.cacheExpiry = this.providerConfig.tolerances.cacheExpiryMs;
  }

  getConfigWarnings(): string[] {
    return this.providerConfig.warnings;
  }

  getConfigSource(): { source: string; path: string } {
    return { source: this.providerConfig.source, path: this.providerConfig.configPath };
  }

  private catalogModels(config: ProviderDef): ModelInfo[] {
    return config.models.map((id) => ({
      id,
      name: id,
      provider: config.id,
      source: 'catalog' as const,
    }));
  }

  private resolveCredential(config: ProviderDef): { value?: string; env?: string } {
    for (const env of [config.envKey, ...config.altEnvKeys]) {
      if (!env) continue;
      const value = process.env[env];
      if (value) return { value, env };
    }
    return {};
  }

  private async resolveProvider(config: ProviderDef, probe: boolean): Promise<ModelProvider> {
    const fallback = this.catalogModels(config);
    const credential = this.resolveCredential(config);
    const canProbe = config.type === 'local' || config.authOptional || Boolean(credential.value);
    const type: ModelProvider['type'] = config.type === 'local' ? 'local' : 'api';

    if (!probe) {
      return {
        id: config.id,
        name: config.name,
        type,
        configured: canProbe,
        models: fallback,
        status: canProbe ? 'catalog_only' : 'unconfigured',
        tier: config.tier,
        defaultModel: config.defaultModel,
        ...(credential.env ? { credentialEnv: credential.env } : {}),
        discovery: 'catalog',
      };
    }

    if (!canProbe) {
      return {
        id: config.id,
        name: config.name,
        type,
        configured: false,
        models: fallback,
        status: 'unconfigured',
        tier: config.tier,
        defaultModel: config.defaultModel,
        discovery: 'catalog',
      };
    }

    const result = await this.fetchModels(config, credential.value);
    return {
      id: config.id,
      name: config.name,
      type,
      configured: true,
      models: mergeModels(result.models, fallback),
      status: result.error ? 'probe_failed' : 'ok',
      ...(result.error ? { error: result.error } : {}),
      tier: config.tier,
      defaultModel: config.defaultModel,
      ...(credential.env ? { credentialEnv: credential.env } : {}),
      discovery: result.error ? 'catalog' : 'live',
    };
  }

  /** Probe in parallel so one slow endpoint costs one timeout, not N timeouts. */
  async listProviders(options: ListProviderOptions = {}): Promise<ModelProvider[]> {
    const configs = this.providerConfig.providers.filter((config) => config.enabled);
    return Promise.all(
      configs.map((config) => this.resolveProvider(config, options.probe !== false))
    );
  }

  async getProvider(
    providerId: string,
    options: ListProviderOptions = {}
  ): Promise<ModelProvider | null> {
    const config = this.providerConfig.providers.find((candidate) => candidate.id === providerId);
    if (!config || !config.enabled) return null;
    return this.resolveProvider(config, options.probe !== false);
  }

  async listModels(
    providerId?: string,
    options: { refresh?: boolean; verbose?: boolean } = {}
  ): Promise<ModelInfo[]> {
    if (!options.refresh) {
      const cached = this.loadCache();
      if (
        cached &&
        cached.provider === (providerId || 'all') &&
        Date.now() - cached.timestamp < this.cacheExpiry
      ) {
        return cached.models.map((model) => ({ ...model, source: 'cache' }));
      }
    }

    let models: ModelInfo[];
    if (providerId) {
      const provider = await this.getProvider(providerId);
      models = provider?.models ?? [];
    } else {
      const providers = await this.listProviders();
      models = providers.flatMap((provider) => provider.models);
    }
    this.saveCache(providerId || 'all', models);
    return models;
  }

  /** Live model discovery with provider-auth-aware headers and pagination. */
  private async fetchModels(config: ProviderDef, apiKey?: string): Promise<ProviderProbe> {
    const timeoutMs = this.providerConfig.tolerances.fetchTimeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const headers: Record<string, string> = { Accept: 'application/json' };

    try {
      const url = new URL(
        `${config.baseUrl.replace(/\/$/, '')}/${config.modelsPath.replace(/^\//, '')}`
      );
      if (config.authStyle === 'query' && apiKey) url.searchParams.set('key', apiKey);
      if (config.authStyle === 'bearer' && apiKey) headers.Authorization = `Bearer ${apiKey}`;
      if (config.authStyle === 'x-api-key' && apiKey) {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
      }

      if (config.id === 'google') url.searchParams.set('pageSize', '1000');
      if (config.id === 'anthropic') url.searchParams.set('limit', '1000');
      if (config.id === 'cohere') url.searchParams.set('page_size', '1000');

      const models: ModelInfo[] = [];
      const seenTokens = new Set<string>();
      for (let page = 0; page < 20; page += 1) {
        const response = await fetch(url, { headers, signal: controller.signal });
        if (!response.ok) {
          return { models, error: `HTTP ${response.status} ${response.statusText}`.trim() };
        }
        const payload = (await response.json()) as Record<string, any>;
        const rows = modelsFromPayload(payload);
        if (!rows) return { models, error: 'unrecognized response shape' };
        for (const row of rows) {
          const normalized = normalizeDiscoveredModel(row, config.id);
          if (normalized && !models.some((model) => model.id === normalized.id)) {
            models.push(normalized);
          }
        }

        const nextToken = payload.nextPageToken ?? payload.next_page_token;
        if (typeof nextToken === 'string' && nextToken && !seenTokens.has(nextToken)) {
          seenTokens.add(nextToken);
          url.searchParams.set(config.id === 'google' ? 'pageToken' : 'page_token', nextToken);
          continue;
        }
        if (payload.has_more === true && typeof payload.last_id === 'string') {
          if (seenTokens.has(payload.last_id)) break;
          seenTokens.add(payload.last_id);
          url.searchParams.set('after_id', payload.last_id);
          continue;
        }
        break;
      }
      return { models };
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
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      this.modelsCachePath,
      JSON.stringify({ provider, models, timestamp: Date.now() }, null, 2)
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
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      this.defaultModelPath,
      JSON.stringify(
        {
          provider: normalizedProvider,
          model: normalizedModel,
          updatedAt: Date.now(),
          id: randomUUID(),
        },
        null,
        2
      )
    );
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
        if (parsed.provider && parsed.model)
          return { provider: parsed.provider, model: parsed.model };
      }
    } catch {
      // Fall through to environment defaults.
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
    if (envModel) return { provider: 'openai', model: envModel };
    return { provider: 'openrouter', model: 'openrouter/auto' };
  }
}
