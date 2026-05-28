import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Provider descriptor — mirrors the entries in data/model-providers.json
 * and ~/.tnf/model-providers.json
 */
export interface ProviderDescriptor {
  id: string;
  name: string;
  model: string;
  priority: number;
  endpoint: string;
  envKey?: string;
  apiKeyRequired?: boolean;
  reliabilityTarget?: number;
  maxLatencyMs?: number;
  costPerMtokens?: number;
  note?: string;
  provider?: string; // logical provider name for special routing
}

/**
 * LLMClient — unified multi-provider client for the TNF CLI.
 *
 * Resolution order (first usable wins):
 *   1. Explicit env vars (TNF_LLM_BASE_URL + TNF_LLM_API_KEY + TNF_LLM_MODEL)
 *   2. model-providers.json fallback chain (probed in priority order)
 *   3. .env auto-detection (NVIDIA_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, etc.)
 *   4. Hardcoded safe fallback (NVIDIA with GPT-OSS-120B)
 *
 * All providers except Gemini-native use the OpenAI-compatible chat/completions
 * endpoint. Gemini-native is kept as a legacy fallback only.
 */
export class LLMClient {
  private apiKey!: string;
  public baseUrl!: string;
  public model!: string;
  public providerName!: string;
  private readonly role: 'orchestrator' | 'worker' | 'reviewer' | 'subagent';
  private envVars: Record<string, string> = {};
  private providers: ProviderDescriptor[] = [];

  constructor(role: 'orchestrator' | 'worker' | 'reviewer' | 'subagent' = 'worker') {
    this.role = role;
    this.loadEnv();
    this.loadProviders();
    this.resolveProvider();
  }

  // ── Environment loading ──────────────────────────────────────────────

  /** Load .env / .env.local from repo root into this.envVars (not process.env) */
  private loadEnv(): void {
    try {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const rootDir = path.resolve(currentDir, '../../../..');
      ['.env', '.env.local'].forEach((file) => {
        const p = path.join(rootDir, file);
        if (fs.existsSync(p)) {
          fs.readFileSync(p, 'utf8')
            .split('\n')
            .forEach((line) => {
              const match = line.match(/^([^#=]+)=(.*)$/);
              if (match) {
                const key = match[1].trim();
                const val = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                if (!this.envVars[key]) this.envVars[key] = val;
                // Also set in process.env for broader compatibility
                if (!process.env[key]) process.env[key] = val;
              }
            });
        }
      });
    } catch (e) {
      // Ignore errors in env loading
    }
  }

  private getEnv(key: string): string {
    return process.env[key] || this.envVars[key] || '';
  }

  // ── Provider catalog loading ─────────────────────────────────────────

  /** Load the provider catalog from model-providers.json files */
  private loadProviders(): void {
    const candidates = [
      path.resolve(process.cwd(), 'data/model-providers.json'),
      path.join(process.env.HOME || '/tmp', '.tnf/model-providers.json'),
    ];

    // Also check the repo-root relative path
    try {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const rootDir = path.resolve(currentDir, '../../../..');
      candidates.unshift(path.join(rootDir, 'data/model-providers.json'));
    } catch {}

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
          if (raw.providers && Array.isArray(raw.providers)) {
            this.providers = raw.providers;
            return;
          }
        } catch {}
      }
    }
  }

  // ── Provider resolution ──────────────────────────────────────────────

  public resolveProvider(): void {
    // ─── Strategy 1: Explicit TNF_LLM env vars ───────────────────────
    const explicitBaseUrl = this.getEnv('TNF_LLM_BASE_URL');
    const explicitApiKey = this.getEnv('TNF_LLM_API_KEY');
    const explicitModel = this.getEnv('TNF_LLM_MODEL');

    if (explicitBaseUrl && explicitApiKey) {
      this.baseUrl = explicitBaseUrl;
      this.apiKey = explicitApiKey;
      this.model = explicitModel || 'model-auto';
      this.providerName = this.detectProviderFromUrl(explicitBaseUrl);
      if (this.model !== explicitModel || this.isProviderAlive(this.providerName)) {
        return; // Explicit config works
      }
      // If explicit config points to a dead model, fall through
    }

    // ─── Strategy 2: Walk the model-providers.json fallback chain ─────
    const sortedProviders = [...this.providers].sort(
      (a, b) => (a.priority ?? 99) - (b.priority ?? 99)
    );

    for (const provider of sortedProviders) {
      const key = this.resolveApiKey(provider);
      if (!key) continue;

      // Quick liveness check — skip if marked dead
      if (provider.note && /402|410|exhausted|gone/i.test(provider.note)) continue;

      this.baseUrl = provider.endpoint;
      this.apiKey = key;
      this.model = provider.model;
      this.providerName = provider.id;
      return;
    }

    // ─── Strategy 3: Auto-detect from available API keys ──────────────
    const autoProviders: Array<{
      envKey: string;
      baseUrl: string;
      defaultModel: string;
      name: string;
    }> = [
      {
        envKey: 'NVIDIA_API_KEY',
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        defaultModel: 'openai/gpt-oss-120b',
        name: 'nvidia',
      },
      {
        envKey: 'GROQ_API_KEY',
        baseUrl: 'https://api.groq.com/openai/v1',
        defaultModel: 'llama3-8b-8192',
        name: 'groq',
      },
      {
        envKey: 'GEMINI_API_KEY',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        defaultModel: 'gemini-2.5-flash',
        name: 'gemini',
      },
      {
        envKey: 'OPENROUTER_API_KEY',
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'openrouter/auto',
        name: 'openrouter',
      },
      {
        envKey: 'DEEPSEEK_API_KEY',
        baseUrl: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
        name: 'deepseek',
      },
      {
        envKey: 'OPENAI_API_KEY',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        name: 'openai',
      },
      {
        envKey: 'CEREBRAS_API_KEY',
        baseUrl: 'https://api.cerebras.ai/v1',
        defaultModel: 'llama-3.3-70b',
        name: 'cerebras',
      },
      {
        envKey: 'SAMBANOVA_API_KEY',
        baseUrl: 'https://api.sambanova.ai/v1',
        defaultModel: 'DeepSeek-R1',
        name: 'sambanova',
      },
    ];

    for (const ap of autoProviders) {
      const key = this.getEnv(ap.envKey);
      if (key) {
        this.baseUrl = ap.baseUrl;
        this.apiKey = key;
        this.model = this.getEnv('TNF_LLM_MODEL') || ap.defaultModel;
        this.providerName = ap.name;

        // If this is a Gemini endpoint but model name is not a Gemini model,
        // fix the mismatch — NVIDIA/Groq models can't run on Gemini API
        if (ap.name === 'gemini' && this.model.includes('/')) {
          this.model = ap.defaultModel;
        }
        return;
      }
    }

    // ─── Strategy 4: Hardcoded safe fallback ──────────────────────────
    this.baseUrl = 'https://integrate.api.nvidia.com/v1';
    this.apiKey = this.getEnv('NVIDIA_API_KEY') || 'missing-key';
    this.model = 'openai/gpt-oss-120b';
    this.providerName = 'nvidia-fallback';
  }

  /** Detect provider name from URL pattern */
  private detectProviderFromUrl(url: string): string {
    if (url.includes('nvidia.com')) return 'nvidia';
    if (url.includes('groq.com')) return 'groq';
    if (url.includes('generativelanguage.googleapis')) return 'gemini';
    if (url.includes('openrouter.ai')) return 'openrouter';
    if (url.includes('deepseek.com')) return 'deepseek';
    if (url.includes('api.openai.com')) return 'openai';
    if (url.includes('anthropic.com')) return 'anthropic';
    if (url.includes('localhost') || url.includes('127.0.0.1')) return 'local';
    return 'custom';
  }

  /** Resolve the API key for a provider descriptor */
  private resolveApiKey(provider: ProviderDescriptor): string {
    // Provider-specific env keys
    const envKeyMap: Record<string, string> = {
      nvidia: 'NVIDIA_API_KEY',
      groq: 'GROQ_API_KEY',
      gemini: 'GEMINI_API_KEY',
      google: 'GEMINI_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      openai: 'OPENAI_API_KEY',
    };

    // Check explicit envKey from descriptor first
    if (provider.envKey) {
      const key = this.getEnv(provider.envKey);
      if (key) return key;
    }

    // Check provider.id prefix for known providers
    for (const [prefix, envKey] of Object.entries(envKeyMap)) {
      if (provider.id.startsWith(prefix)) {
        const key = this.getEnv(envKey);
        if (key) return key;
      }
    }

    // Check logical provider field
    if (provider.provider && envKeyMap[provider.provider]) {
      const key = this.getEnv(envKeyMap[provider.provider]);
      if (key) return key;
    }

    // Fall back to TNF_LLM_API_KEY
    return this.getEnv('TNF_LLM_API_KEY');
  }

  /** Rough liveness check — true if we have no evidence the provider is dead */
  private isProviderAlive(providerName: string): boolean {
    return true; // Optimistic — actual failures caught at call time
  }

  // ── Chat completion ──────────────────────────────────────────────────

  async chatComplete(messages: LLMMessage[], options: LLMOptions = {}): Promise<string> {
    if (!this.apiKey || this.apiKey === 'missing-key') {
      // Re-resolve in case env was just loaded
      this.resolveProvider();
      if (!this.apiKey || this.apiKey === 'missing-key') {
        throw new Error(
          'LLM API key not found. Set one of: NVIDIA_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, or TNF_LLM_API_KEY'
        );
      }
    }

    // Try primary provider
    try {
      return await this._callProvider(messages, options);
    } catch (primaryErr: any) {
      // If primary fails, try fallback chain
      const fallbackResult = await this._tryFallbacks(messages, options, primaryErr);
      if (fallbackResult !== null) return fallbackResult;

      // All providers exhausted
      throw primaryErr;
    }
  }

  /** Route to the correct API format for the current baseUrl */
  private async _callProvider(messages: LLMMessage[], options: LLMOptions): Promise<string> {
    // Gemini native API (legacy)
    if (this.baseUrl.includes('generativelanguage.googleapis.com')) {
      // Validate model name is actually a Gemini model
      if (this.model.includes('/')) {
        // Cross-provider mismatch! Model looks like NVIDIA/OpenRouter format
        // Switch to a valid Gemini model
        this.model = 'gemini-2.5-flash';
      }
      return this.callGemini(messages, options);
    }

    // All other providers: OpenAI-compatible chat/completions
    return this.callOpenAICompatible(messages, options);
  }

  /** OpenAI-compatible chat/completions endpoint (NVIDIA, Groq, OpenRouter, etc.) */
  private async callOpenAICompatible(messages: LLMMessage[], options: LLMOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM provider error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as any;
    const choice = data.choices?.[0]?.message;
    // Some models (e.g. GPT-OSS-120B, reasoning models) put output in
    // reasoning_content when content is null. Fall back gracefully.
    return choice?.content || choice?.reasoning_content || '';
  }

  /** Gemini native API (generateContent endpoint) */
  private async callGemini(messages: LLMMessage[], options: LLMOptions): Promise<string> {
    const geminiMessages = messages
      .filter((m) => m.role !== 'system') // Gemini doesn't support system role in contents
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Add system message as first user turn if present
    const systemMsg = messages.find((m) => m.role === 'system');
    if (systemMsg) {
      geminiMessages.unshift({
        role: 'user',
        parts: [{ text: `System instructions: ${systemMsg.content}` }],
      });
    }

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: geminiMessages }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // ── Fallback chain ──────────────────────────────────────────────────

  /** Try remaining providers from the catalog when the primary fails */
  private async _tryFallbacks(
    messages: LLMMessage[],
    options: LLMOptions,
    primaryError: any
  ): Promise<string | null> {
    if (this.providers.length === 0) return null;

    const sorted = [...this.providers].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

    // Skip providers we've already tried (current baseUrl)
    const tried = new Set([this.baseUrl]);

    for (const provider of sorted) {
      if (tried.has(provider.endpoint)) continue;
      tried.add(provider.endpoint);

      // Skip known-dead providers
      if (provider.note && /402|410|exhausted|gone/i.test(provider.note)) continue;

      const key = this.resolveApiKey(provider);
      if (!key) continue;

      const savedBaseUrl = this.baseUrl;
      const savedApiKey = this.apiKey;
      const savedModel = this.model;
      const savedProvider = this.providerName;

      try {
        this.baseUrl = provider.endpoint;
        this.apiKey = key;
        this.model = provider.model;
        this.providerName = provider.id;
        const result = await this._callProvider(messages, options);
        console.log(`[tnf] Fallback succeeded: ${provider.name} (${provider.model})`);
        return result;
      } catch {
        // Restore and try next
        this.baseUrl = savedBaseUrl;
        this.apiKey = savedApiKey;
        this.model = savedModel;
        this.providerName = savedProvider;
      }
    }

    return null;
  }

  // ── Model discovery ──────────────────────────────────────────────────

  async fetchAvailableModels(): Promise<string[]> {
    if (!this.apiKey) return [];

    // Gemini has a different models endpoint structure
    if (this.baseUrl.includes('generativelanguage.googleapis.com')) {
      try {
        const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
        if (!response.ok) return [];
        const data = (await response.json()) as any;
        return data.models?.map((m: any) => m.name.replace('models/', '')) || [];
      } catch {
        return [];
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!response.ok) return [];
      const data = (await response.json()) as any;
      if (Array.isArray(data.data)) {
        return data.data.map((m: any) => m.id);
      }
      return [];
    } catch {
      return [];
    }
  }

  /** Return all configured providers with their status */
  getProviderCatalog(): { id: string; name: string; model: string; hasKey: boolean }[] {
    return this.providers.map((p) => ({
      id: p.id,
      name: p.name,
      model: p.model,
      hasKey: !!this.resolveApiKey(p),
    }));
  }
}
