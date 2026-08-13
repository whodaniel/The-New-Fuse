import * as os from 'os';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

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

export interface ModelProvider {
  id: string;
  name: string;
  type: 'api' | 'oauth' | 'local';
  configured: boolean;
  models: ModelInfo[];
}

export class ModelsService {
  private modelsCachePath: string;
  private defaultModelPath: string;
  private cacheExpiry: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor(cachePath?: string) {
    this.modelsCachePath = cachePath || path.join(os.homedir(), '.cache', 'tnf', 'models.json');
    this.defaultModelPath = path.join(os.homedir(), '.config', 'tnf', 'model.default.json');
  }

  async listProviders(): Promise<ModelProvider[]> {
    const providers: ModelProvider[] = [];

    const providerConfigs = [
      { id: 'openai', name: 'OpenAI', envKey: 'OPENAI_API_KEY', baseUrl: 'https://api.openai.com/v1' },
      { id: 'anthropic', name: 'Anthropic', envKey: 'ANTHROPIC_API_KEY', baseUrl: 'https://api.anthropic.com/v1' },
      { id: 'google', name: 'Google AI', envKey: 'GOOGLE_API_KEY', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
      { id: 'deepseek', name: 'DeepSeek', envKey: 'DEEPSEEK_API_KEY', baseUrl: 'https://api.deepseek.com/v1' },
      { id: 'groq', name: 'Groq', envKey: 'GROQ_API_KEY', baseUrl: 'https://api.groq.com/openai/v1' },
      { id: 'openrouter', name: 'OpenRouter', envKey: 'OPENROUTER_API_KEY', baseUrl: 'https://openrouter.ai/api/v1' },
      { id: 'nvidia', name: 'NVIDIA NIM', envKey: 'NVIDIA_API_KEY', baseUrl: 'https://integrate.api.nvidia.com/v1' },
    ];

    for (const config of providerConfigs) {
      const configured = !!process.env[config.envKey];
      const models = configured ? await this.fetchModels(config.id, config.baseUrl, process.env[config.envKey]!) : [];

      providers.push({
        id: config.id,
        name: config.name,
        type: 'api',
        configured,
        models,
      });
    }

    return providers;
  }

  async listModels(providerId?: string, options: { refresh?: boolean; verbose?: boolean } = {}): Promise<ModelInfo[]> {
    if (!options.refresh) {
      const cached = this.loadCache();
      if (cached && cached.provider === providerId && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.models;
      }
    }

    const providers = await this.listProviders();
    if (providerId) {
      const provider = providers.find(p => p.id === providerId);
      return provider?.models || [];
    }

    const allModels: ModelInfo[] = [];
    for (const provider of providers) {
      allModels.push(...provider.models);
    }

    this.saveCache(providerId || 'all', allModels);
    return allModels;
  }

  private async fetchModels(providerId: string, baseUrl: string, apiKey: string): Promise<ModelInfo[]> {
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

      const response = await fetch(url, { headers });
      if (!response.ok) return [];

      const data = await response.json() as any;

      if (Array.isArray(data.data)) {
        return data.data.map((m: any) => ({
          id: m.id,
          name: m.id,
          provider: providerId,
          contextWindow: m.context_window,
          maxOutput: m.max_output_tokens,
          inputCost: m.pricing?.input ? parseFloat(m.pricing.input) * 1000000 : undefined,
          outputCost: m.pricing?.output ? parseFloat(m.pricing.output) * 1000000 : undefined,
          features: m.features,
        }));
      }

      if (Array.isArray(data.models)) {
        return data.models.map((m: any) => ({
          id: m.name.replace('models/', ''),
          name: m.displayName || m.name.replace('models/', ''),
          provider: providerId,
          contextWindow: m.inputTokenLimit,
          maxOutput: m.outputTokenLimit,
          features: m.supportedGenerationMethods,
        }));
      }

      return [];
    } catch {
      return [];
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
    fs.writeFileSync(this.modelsCachePath, JSON.stringify({
      provider,
      models,
      timestamp: Date.now(),
    }, null, 2));
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

    return { success: true, message: `Default model set to ${normalizedProvider}:${normalizedModel}` };
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
