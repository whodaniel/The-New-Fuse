import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { resolveBuiltinToolsAsOpenAI } from './llm-tools.js';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** OpenAI-style tool definitions to send with the request. */
  tools?: Array<Record<string, unknown>>;
  /**
   * Override tool_choice for this call. Defaults to "auto" when tools are
   * supplied and the active provider supports tool calling. Pass "none" to
   * explicitly disable tool calling for a single request.
   */
  toolChoice?: 'auto' | 'none' | 'required' | string;
  /**
   * Autonomy-first default: when the caller does NOT supply `tools`,
   * attach the canonical TNF built-in tool set (bash, read_file,
   * write_file, search_files, web_search, web_fetch, browser_interact,
   * list_skills, load_skill, memory_recall). Pass:
   *   • 'none'             → strip every built-in
   *   • 'all'              → attach every default-enabled tool
   *   • undefined          → default ('all')
   *   • string[] of names  → subset, intersected with the catalog
   *   • (anything truthy but no list)
   *
   * When `tools` is supplied alongside `builtinTools`, the explicit
   * `tools` array wins and no built-ins are added.
   */
  builtinTools?: 'none' | 'all' | string[] | undefined;
  /**
   * Override streaming behavior for this call. Default behavior is set
   * by `TNF_LLM_STREAM` ('always' / 'never' / 'auto'). A per-call value
   * here is honoured with the highest precedence.
   */
  stream?: boolean;
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
  reasoningEffort?: string; // NeuralWatt GLM-5.2: low | medium | high
  /**
   * Whether this provider supports OpenAI-style tool calls / tool_choice:"auto".
   * Hosted NVIDIA, Groq, OpenRouter, DeepSeek etc. do. A local vLLM server only
   * does if it was launched with --enable-auto-tool-choice --tool-call-parser=…
   * When undefined we infer from the endpoint URL (true for hosted, false for
   * loopback unless TNF_LLM_SUPPORTS_TOOL_CHOICE is explicitly set).
   */
  supportsToolChoice?: boolean;
}

function parsePositiveIntegerEnv(name: string): number | null {
  const raw = process.env[name];
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Autonomy-first default: 10 minutes per call instead of the previous
 * 3 minutes. Long-running agents — especially sub-agent chains,
 * terraform-level inference, and exhaustive fallback walks — routinely
 * exceed the older cap. Override with TNF_LLM_TIMEOUT_MS or
 * TNF_PROVIDER_TIMEOUT_MS.
 */
function defaultProviderTimeoutMs(): number {
  return (
    parsePositiveIntegerEnv('TNF_LLM_TIMEOUT_MS') ??
    parsePositiveIntegerEnv('TNF_PROVIDER_TIMEOUT_MS') ??
    600_000
  );
}

/**
 * Maximum retry attempts on transient provider errors (429/5xx).
 * Default 3 → primary + 2 retries before falling back. Override with
 * TNF_LLM_RETRY_MAX. Set to 0 to disable retry.
 */
function retryMax(): number {
  const raw = parsePositiveIntegerEnv('TNF_LLM_RETRY_MAX');
  return raw === null ? 3 : raw;
}

/**
 * Base backoff in ms for exponential retry. Doubles each attempt and
 * honours Retry-After when the provider sends one. Override with
 * TNF_LLM_RETRY_BASE_MS.
 */
function retryBaseMs(): number {
  const raw = parsePositiveIntegerEnv('TNF_LLM_RETRY_BASE_MS');
  return raw === null ? 500 : raw;
}

/**
 * Decide whether a status code is worth retrying. 429 (rate limit) and
 * 5xx (server-side) are transient by definition; 401/403/400/404 are
 * not — they will fail again with the same request. 408 (request
 * timeout) is also retried.
 */
function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

/**
 * Sleep helper backed by setTimeout — NOT AbortSignal-based because we
 * want to back off even if the parent AbortSignal hasn't fired yet.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse `Retry-After` header (seconds OR HTTP-date) into ms. Returns
 * null when the header is missing or unparseable — caller falls back
 * to exponential backoff in that case.
 */
function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  // Numeric seconds
  const asInt = Number.parseInt(trimmed, 10);
  if (Number.isFinite(asInt) && asInt >= 0 && /^\d+$/.test(trimmed)) {
    return asInt * 1000;
  }
  // HTTP-date
  const dateMs = Date.parse(trimmed);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return null;
}

/**
 * Wrap `fetch(url, init)` with automatic retry on transient errors.
 * - Retries on 408/429/5xx with exponential backoff (base * 2^attempt).
 * - Honours Retry-After when provided.
 * - Respects the outer AbortSignal — does NOT swallow user cancels.
 * - Bubbles non-retryable status codes immediately.
 *
 * Returned Response is the LAST attempt's response (success or final
 * failure). The body is left unconsumed; callers parse it as usual.
 */
async function fetchWithRetry(url: string, init: RequestInit, context: string): Promise<Response> {
  const max = retryMax();
  const base = retryBaseMs();
  const outerSignal = init.signal;

  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= max; attempt++) {
    if (attempt > 0) {
      const hint = parseRetryAfter(lastResponse?.headers.get('retry-after') ?? null);
      const backoff = hint ?? Math.min(base * 2 ** (attempt - 1), 30_000);
      if (process.env.TNF_DEBUG_PROVIDERS === 'true') {
        console.warn(
          `[tnf] retry attempt ${attempt}/${max} for ${context} after ${backoff}ms ` +
            `(last status: ${lastResponse?.status ?? 'network-error'})`
        );
      }
      await sleep(backoff);
    }

    try {
      const response = await fetch(url, init);
      lastResponse = response;
      if (response.ok || !isRetryableStatus(response.status)) {
        return response; // Success, or non-retryable failure → caller decides
      }
      // Drain the body so the connection is reuseable; do not parse yet.
      try {
        await response.clone().text();
      } catch {
        // Swallow — body drain failure shouldn't abort retry
      }
    } catch (err: any) {
      // Network / DNS / abort errors. Honour the outer AbortSignal.
      if (outerSignal?.aborted) throw err;
      lastError = err;
    }

    // Loop continues if we have retries left AND the last status was retryable.
    if (attempt >= max) break;
  }

  if (lastResponse) return lastResponse;
  throw lastError instanceof Error
    ? lastError
    : new Error(`fetchWithRetry(${context}): exhausted ${max + 1} attempts`);
}

/**
 * Per-request connectedness timeout for health probes / fast endpoints.
 * Used when the caller demands a quick liveness check rather than a
 * full chat completion (e.g. provider fallback chain walk).
 */
function probeTimeoutMs(): number {
  return parsePositiveIntegerEnv('TNF_LLM_PROBE_TIMEOUT_MS') ?? 5_000;
}

/**
 * Resolved streaming policy.
 *  • 'always' → every chat call streams
 *  • 'never'  → suppress streaming entirely
 *  • 'auto'   → stream when the provider looks streaming-friendly
 *
 * 'auto' is the autonomy-first default — we trust the operator's
 * preference to fall back to whatever default the env / per-caller
 * override specifies.
 */
function resolveStreamPolicy(perCall?: boolean): 'always' | 'never' | 'auto' {
  if (typeof perCall === 'boolean') return perCall ? 'always' : 'never';
  const env = (process.env.TNF_LLM_STREAM || 'auto').trim().toLowerCase();
  if (env === 'always' || env === 'true' || env === '1' || env === 'on') return 'always';
  if (env === 'never' || env === 'false' || env === '0' || env === 'off') return 'never';
  return 'auto';
}

/**
 * vLLM (and other raw OpenAI-compatible servers started without
 * `--enable-auto-tool-choice --tool-call-parser=…`) reject requests that
 * include `tool_choice:"auto"`. Hosted providers (NVIDIA/Groq/OpenRouter/etc.)
 * always support it.
 *
 * Autonomy-first default: we OPTIMISTICALLY assume tool-calling works even
 * for loopback hosts. If the server actually rejects the first `auto` call,
 * the request layer (callOpenAICompatible) retries once without tools before
 * propagating the error. The user can still force the conservative behavior
 * with `TNF_LLM_SUPPORTS_TOOL_CHOICE=false`. An explicit `true` short-circuits
 * URL inspection entirely.
 */
function providerSupportsToolChoice(baseUrl: string): boolean {
  const explicit = (process.env.TNF_LLM_SUPPORTS_TOOL_CHOICE || '').trim().toLowerCase();
  if (explicit === 'true' || explicit === '1') return true;
  if (explicit === 'false' || explicit === '0') return false;
  // Optimistic default — assume the local server is configured correctly.
  // callOpenAICompatible handles the 400-with-instruction-message fallback.
  return true;
}

/**
 * Mutate `payload` in place to add `tools` / `tool_choice` only when the
 * active provider actually supports tool calling AND the caller supplied
 * tools. We never emit `tool_choice` without `tools`, since OpenAI-compatible
 * servers (most notably raw vLLM) reject `tool_choice:"auto"` outright.
 *
 * If the caller passed an explicit `toolChoice` of "none" we silently drop
 * the tools field too — the caller is asking for tool-free generation.
 *
 * The autonomy-first default is: when the caller does NOT supply a tools
 * array AND does not pass builtinTools:'none', we attach the canonical TNF
 * built-in tool set so the agent loop can do real work without bespoke
 * scaffolding at each call site.
 */
function applyToolPayload(
  payload: Record<string, unknown>,
  supportsToolChoice: boolean,
  options: LLMOptions,
  builtinToolsProvider?: (opts: LLMOptions) => Array<Record<string, unknown>>
): void {
  const explicitChoice = options.toolChoice;
  if (explicitChoice === 'none') {
    // Caller is opting out — strip anything tool-related.
    delete payload.tools;
    delete payload.tool_choice;
    return;
  }

  // Resolve the effective tools list: caller-supplied wins over builtins.
  const callerTools = options.tools;
  let effectiveTools: Array<Record<string, unknown>> | undefined;
  if (Array.isArray(callerTools) && callerTools.length > 0) {
    effectiveTools = callerTools;
  } else if (builtinToolsProvider && options.builtinTools !== 'none') {
    const builtins = builtinToolsProvider(options);
    if (builtins.length > 0) effectiveTools = builtins;
  }

  if (!effectiveTools || effectiveTools.length === 0) {
    // Caller didn't ask for tool calling this turn.
    delete payload.tools;
    delete payload.tool_choice;
    return;
  }

  if (!supportsToolChoice) {
    // Provider cannot honor tool_choice. We *could* fall back to injecting the
    // tool descriptions into the system prompt, but that belongs to a higher
    // layer (prompt-rewriting middleware). For now, drop silently and log.
    if (process.env.TNF_DEBUG_PROVIDERS === 'true') {
      console.warn(
        '[tnf] tools supplied but provider does not support tool_choice — dropping. ' +
          'If this is a raw vLLM server, restart it with ' +
          '"--enable-auto-tool-choice --tool-call-parser=<parser>".'
      );
    }
    delete payload.tools;
    delete payload.tool_choice;
    return;
  }

  payload.tools = effectiveTools;
  payload.tool_choice = explicitChoice ?? 'auto';
}

/**
 * LLMClient — unified multi-provider client for the TNF CLI.
 *
 * Resolution order (first usable wins):
 *   1. Explicit env vars (TNF_LLM_BASE_URL + TNF_LLM_API_KEY + TNF_LLM_MODEL)
 *   2. Dynamic provider detection (inspects env, verifies connectivity)
 *   3. model-providers.json fallback chain (probed in priority order)
 *   4. Hardcoded safe fallback (NVIDIA with verified model)
 *
 * All providers except Gemini-native use the OpenAI-compatible chat/completions
 * endpoint. Gemini-native is kept as a legacy fallback only.
 */
export class LLMClient {
  private apiKey!: string;
  public baseUrl!: string;
  public model!: string;
  public providerName!: string;
  /**
   * Resolved capability flag — true when the active provider accepts
   * OpenAI-style tool_choice:"auto". See providerSupportsToolChoice.
   */
  public supportsToolChoice = true;
  private readonly role: 'orchestrator' | 'worker' | 'reviewer' | 'subagent';
  private envVars: Record<string, string> = {};
  private providers: ProviderDescriptor[] = [];
  /**
   * Per-call builtin-tool resolver. `applyToolPayload` invokes this with
   * the call-site `options` so "all" / "none" / named subsets work the same
   * way regardless of who is calling — callers don't have to manage the
   * catalog themselves.
   */
  private _builtinToolsProvider = (options: LLMOptions): Array<Record<string, unknown>> => {
    return resolveBuiltinToolsAsOpenAI(options);
  };

  constructor(role: 'orchestrator' | 'worker' | 'reviewer' | 'subagent' = 'worker') {
    this.role = role;
    this.loadEnv();
    this.loadProviders();
    // Provider resolution deferred to async create() method
  }

  /** Static async factory for proper async initialization */
  static async create(
    role: 'orchestrator' | 'worker' | 'reviewer' | 'subagent' = 'worker'
  ): Promise<LLMClient> {
    const client = new LLMClient(role);
    await client.resolveProvider();
    return client;
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
            .split('\\n')
            .forEach((line) => {
              const match = line.match(/^([^#=]+)=(.*)$/);
              if (match) {
                const key = match[1].trim();
                const val = match[2].trim().replace(/^[\"'](.*)[\"']$/, '$1');
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

  /** Resolve the LLM provider configuration. Returns a promise that resolves when resolution is complete. */
  public async resolveProvider(): Promise<void> {
    // ─── Strategy 1: Explicit TNF_LLM env vars ───────────────────────
    const explicitBaseUrl = this.getEnv('TNF_LLM_BASE_URL');
    const explicitApiKey = this.getEnv('TNF_LLM_API_KEY');
    const explicitModel = this.getEnv('TNF_LLM_MODEL');

    if (explicitBaseUrl && explicitApiKey) {
      this.baseUrl = explicitBaseUrl;
      this.apiKey = explicitApiKey;
      this.model = explicitModel || 'model-auto';
      this.providerName = this.detectProviderFromUrl(explicitBaseUrl);
      this.supportsToolChoice = providerSupportsToolChoice(explicitBaseUrl);
      // We consider explicit config as working even if the model is not alive;
      // the caller will handle errors at call time.
      return;
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
      this.supportsToolChoice =
        typeof provider.supportsToolChoice === 'boolean'
          ? provider.supportsToolChoice
          : providerSupportsToolChoice(provider.endpoint);
      return;
    }

    // ─── Strategy 3: Dynamic Provider Detection ─────────────────────
    // If we reach here, no explicit or catalog provider worked.
    // Try dynamic detection.
    try {
      const { detectProviders, reportDetection } = await import('./llm-provider-detector.js');
      const detection = await detectProviders();
      if (detection.selected) {
        this.baseUrl = detection.selected.baseUrl;
        this.apiKey = this.getEnv(detection.selected.envKey);
        this.model =
          this.getEnv('TNF_LLM_MODEL') ||
          detection.selected.selectedModel ||
          (detection.selected.models ?? [])[0] ||
          'nvidia/nemotron-3-ultra-550b-a55b';

        if (process.env.TNF_DEBUG_PROVIDERS === 'true') {
          reportDetection(detection);
        }
        return;
      }
    } catch (err) {
      // Dynamic detection failed; fall through to hardcoded fallback
      if (process.env.TNF_DEBUG_PROVIDERS === 'true') {
        console.error('[tnf] Dynamic provider detection failed:', err);
      }
    }

    // ─── Hardcoded Fallback ───────────────────────────────────────
    this.baseUrl = 'https://integrate.api.nvidia.com/v1';
    this.apiKey = this.getEnv('NVIDIA_API_KEY') || 'missing-key';
    this.model = 'nvidia/nemotron-3-ultra-550b-a55b';
    this.providerName = 'nvidia-fallback';
    this.supportsToolChoice = true; // Hosted NVIDIA supports tool_choice:"auto".
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
    if (url.includes('neuralwatt.com')) return 'neuralwatt';
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
      neuralwatt: 'NEURALWATT_API_KEY',
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
      await this.resolveProvider();
      if (!this.apiKey || this.apiKey === 'missing-key') {
        throw new Error(
          'LLM API key not found. Set one of: NVIDIA_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, or TNF_LLM_API_KEY'
        );
      }
    }

    // Streaming policy: 'auto' is the autonomy-first default. When the URL is
    // obviously streaming-incompatible (gemini native) or the env says 'never',
    // we skip. Otherwise stream, collapsing to a final string at the end.
    const policy = resolveStreamPolicy(options.stream);
    if (policy === 'always') {
      let buffer = '';
      for await (const chunk of this.chatStream(messages, options)) buffer += chunk;
      return buffer;
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

  /**
   * Streaming chat completion — yields response chunks as they arrive.
   * Falls back to non-streaming if streaming is not supported.
   */
  async *chatStream(
    messages: LLMMessage[],
    options: LLMOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey || this.apiKey === 'missing-key') {
      await this.resolveProvider();
      if (!this.apiKey || this.apiKey === 'missing-key') {
        throw new Error(
          'LLM API key not found. Set one of: NVIDIA_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, or TNF_LLM_API_KEY'
        );
      }
    }

    // Gemini doesn't support streaming in the same way — fall back to non-streaming
    if (this.baseUrl.includes('generativelanguage.googleapis.com')) {
      const full = await this.chatComplete(messages, options);
      yield full;
      return;
    }

    // OpenAI-compatible streaming
    try {
      yield* this._streamOpenAICompatible(messages, options);
    } catch (err) {
      // Fall back to non-streaming on streaming errors
      const full = await this.chatComplete(messages, options);
      yield full;
    }
  }

  /**
   * Parallel-first winner: dispatch the same chat call to several providers
   * simultaneously and return the first non-empty response. Used when an
   * agent loop needs to keep moving despite a flaky single provider — the
   * cost is N-times tokens, but for autonomy that's an acceptable tradeoff.
   *
   * Optional handles (bottom-up). Last-write-wins per message role; we keep
   * a half-stable chat so we don't overwhelm fallback providers.
   *
   * Note: callers usually do NOT need this — `_callProvider` already
   * walks the entire fallback chain on failure. This is for advanced
   * latency-critical deployments that want the fastest read instead of
   * the most-reliable read.
   */
  async chatCompleteParallelFirstWins(
    providers: Array<{
      baseUrl: string;
      apiKey: string;
      model: string;
    }>,
    messages: LLMMessage[],
    options: LLMOptions = {}
  ): Promise<string> {
    const calls = providers.map((p) => async () => {
      const url = `${p.baseUrl.replace(/\/$/, '')}/chat/completions`;
      const payload: Record<string, unknown> = {
        model: p.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1000,
      };
      const policy = resolveStreamPolicy(options.stream);
      if (policy === 'always') payload.stream = true;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + p.apiKey,
        },
        signal: AbortSignal.timeout(options.timeoutMs ?? defaultProviderTimeoutMs()),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Provider ${p.model} @ ${p.baseUrl} -> HTTP ${response.status}`);
      }
      const data = (await response.json()) as any;
      const choice = data.choices?.[0]?.message;
      return choice?.content || choice?.reasoning_content || choice?.reasoning || '';
    });

    // Promise.any first wins; all-reject path returns the joiner message.
    try {
      const settled = await Promise.any(calls.map((mk) => mk()));
      return settled;
    } catch (err) {
      throw new Error(
        `All ${providers.length} parallel providers failed: ${(err as Error)?.message ?? err}`
      );
    }
  }

  /**
   * Tool-loop chat completion — runs the full "agent loop" transparently:
   * call the model, parse tool_calls, dispatch to a caller-supplied executor,
   * feed the tool result back into the message log, repeat until the model
   * emits a final assistant message or `maxIterations` is hit.
   *
   * The executor signature is `(name, args) => Promise<string | object>`.
   * Anything except the built-in tool set can be wired here: it doesn't have
   * to live in `llm-tools.ts` — callers may pass their own toolspaces
   * through `options.tools` and route execution however they like.
   *
   * This is the public mirror of the Python daemon's `chat_with_tools` —
   * the autonomy-first default is `maxIterations: 25` so a single call can
   * drive a non-trivial multi-step task end-to-end.
   */
  async chatCompleteWithTools(
    messages: LLMMessage[],
    executor: (
      name: string,
      args: Record<string, unknown>
    ) => Promise<string | Record<string, unknown>>,
    options: LLMOptions & { maxIterations?: number; systemPrompt?: string } = {}
  ): Promise<{ content: string; toolCallsMade: number; iterations: number; finishReason: string }> {
    /**
     * Autonomy-first default: NO iteration cap. The whole point of
     * chatCompleteWithTools is to let the agent keep working until it
     * genuinely produces a final assistant message. Hard caps here
     * silently killed long refactors, multi-environment migrations,
     * and orchestration sweeps in the past.
     *
     * Pass `options.maxIterations: <n>` (positive integer) to opt-out —
     * useful in tests, in web REPLs, and when the caller wants a hard
     * ceiling against runaway loops (e.g. an obviously broken tool
     * returning "more work" forever). A sentinel value of 0 also
     * disables the cap; <0 falls back to unlimited.
     */
    const maxIter =
      options.maxIterations === undefined
        ? Number.POSITIVE_INFINITY
        : options.maxIterations <= 0
          ? Number.POSITIVE_INFINITY
          : options.maxIterations;
    let iterations = 0;
    let toolCallsMade = 0;

    let working: LLMMessage[] = [...messages];
    if (options.systemPrompt) {
      working.unshift({ role: 'system', content: options.systemPrompt });
    } else if (!working.some((m) => m.role === 'system')) {
      // Always include a default autonomy-flavored system prompt so models
      // remember they may call tools without explicit prompting each turn.
      working.unshift({
        role: 'system',
        content:
          'You are an autonomous TNF agent. Use the available tools liberally. ' +
          'When a task is complete, return a final assistant message — do not loop forever. ' +
          'Prefer observing before acting; prefer acting before guessing.',
      });
    }

    /**
     * Loop until either:
     *   • the model emits a final assistant message (no tool_calls), or
     *   • the per-call maxIterations ceiling is hit (sentinel only).
     *
     * No ceiling by default — autonomy-first. Runaway runs are bounded
     * by the per-call HTTP timeout (`TNF_LLM_TIMEOUT_MS`, default 600s)
     * and by sensible tool-executor backstops (large tools should
     * throw or refuse after some internal budget).
     */
    for (let iter = 0; iter < maxIter; iter++) {
      iterations++;
      // Fallback-aware raw call: chatComplete walks the provider fallback
      // chain on failure, but this loop previously called _callProviderRaw
      // directly — a single primary-provider timeout crashed the whole
      // tool-calling session (verified live 2026-07-22). Walk the same
      // chain here so native tool calling is as resilient as plain chat.
      const response = await this._callProviderRawWithFallbacks(working, {
        ...options,
        toolChoice: options.toolChoice ?? 'auto',
      });
      if (!response.ok) break;
      const choice = (response.body as any).choices?.[0]?.message;
      const finish = (response.body as any).choices?.[0]?.finish_reason ?? 'stop';
      const toolCalls = choice?.tool_calls as
        | Array<{ id: string; function: { name: string; arguments: string } }>
        | undefined;

      working.push({
        role: 'assistant',
        content: choice?.content || '',
        // Wire-shape augmentation: OpenAI tool_calls lands on assistant messages.
        tool_calls: toolCalls,
      } as LLMMessage & { tool_calls?: typeof toolCalls });

      if (!toolCalls || toolCalls.length === 0) {
        return {
          content: choice?.content || '',
          toolCallsMade,
          iterations,
          finishReason: finish,
        };
      }

      for (const tc of toolCalls) {
        const args = (() => {
          try {
            return JSON.parse(tc.function.arguments || '{}');
          } catch {
            return {};
          }
        })();
        let resultText: string;
        try {
          const r = await executor(tc.function.name, args);
          resultText = typeof r === 'string' ? r : JSON.stringify(r);
        } catch (err) {
          resultText = `tool_error: ${(err as Error)?.message ?? String(err)}`;
        }
        toolCallsMade++;
        // Wire-shape augmentation: tool role + tool_call_id carry the result back.
        working.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: resultText,
        } as LLMMessage & { tool_call_id: string; role: 'tool' });
      }
    }

    // Cap hit while the model was still tool-calling. The last working
    // message is almost always a tool result — never surface that JSON as
    // the assistant reply (that broke TUI persistence: operators only saw
    // raw {"ok":true,...} dumps and stall breaks). Prefer the last real
    // assistant text, then force one tool-free synthesis turn.
    const lastAssistantText = [...working]
      .reverse()
      .find(
        (m) =>
          m.role === 'assistant' &&
          typeof m.content === 'string' &&
          m.content.trim() &&
          !(m as { tool_calls?: unknown }).tool_calls
      )?.content;

    working.push({
      role: 'system',
      content:
        '[tool loop] Iteration cap reached. Stop calling tools. Reply to the operator in plain language: what you did, what you learned, and the next concrete step.',
    });
    try {
      const synthesis = await this._callProviderRawWithFallbacks(working, {
        ...options,
        toolChoice: 'none',
        maxTokens: Math.max(options.maxTokens ?? 0, 2000),
      });
      if (synthesis.ok) {
        const synthText = String(
          (synthesis.body as any)?.choices?.[0]?.message?.content || ''
        ).trim();
        if (synthText) {
          return {
            content: synthText,
            toolCallsMade,
            iterations,
            finishReason: 'max_iterations_synthesized',
          };
        }
      }
    } catch {
      // Fall through to last-assistant / explicit notice.
    }

    return {
      content:
        (typeof lastAssistantText === 'string' && lastAssistantText.trim()
          ? lastAssistantText
          : '') ||
        `Agent loop hit maxIterations (${maxIter}) after ${toolCallsMade} tool call(s) without a final assistant message. Summarize progress for the operator on the next turn.`,
      toolCallsMade,
      iterations,
      finishReason: 'max_iterations',
    };
  }

  /** Internal: returns the raw JSON body from a single non-streaming call. Used by `chatCompleteWithTools`. */
  private async _callProviderRaw(
    messages: LLMMessage[],
    options: LLMOptions
  ): Promise<{ ok: boolean; status: number; body: any }> {
    const payload: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
    };
    applyToolPayload(payload, this.supportsToolChoice, options, this._builtinToolsProvider);

    const url = `${this.baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.apiKey,
    };
    const res = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(options.timeoutMs ?? defaultProviderTimeoutMs()),
        body: JSON.stringify(payload),
      },
      `${this.providerName}:${this.model}`
    );
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { ok: res.ok, status: res.status, body };
  }

  /**
   * POST `payload` to the active provider's /chat/completions endpoint.
   * If the server returns HTTP 400 pointing at missing tool_choice support
   * (`--enable-auto-tool-choice` / `--tool-call-parser`) we automatically
   * strip the tool fields from a clone of the payload and retry once. That
   * keeps autonomous runs alive even when the local vLLM hasn't been
   * pre-configured with the parser flags.
   *
   * Returns the raw fetch Response. Callers handle SSE / JSON parsing.
   */
  private async _postWithToolRetry(
    payload: Record<string, unknown>,
    options: LLMOptions,
    timeoutMs: number
  ): Promise<Response> {
    const url = `${this.baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.apiKey,
    };

    let bodyJson = JSON.stringify(payload);
    let response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(timeoutMs),
        body: bodyJson,
      },
      `${this.providerName}:${this.model}`
    );

    if (response.ok || response.status !== 400) return response;

    const firstText = await response.clone().text();
    const needsRetry =
      /enable-auto-tool-choice|tool-call-parser|tool_choice/.test(firstText) &&
      (Array.isArray(payload.tools) || 'tool_choice' in payload);
    if (!needsRetry) {
      // Not a tool_choice error — bubble the original response up.
      return new Response(firstText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    // Demote: retry without tool fields, log once so the operator notices.
    if (process.env.TNF_DEBUG_PROVIDERS === 'true') {
      console.warn(
        `[tnf] ${this.baseUrl} rejected tool_choice on first attempt — retrying tools-free. ` +
          'For full tool calling, restart the upstream vLLM with ' +
          '"--enable-auto-tool-choice --tool-call-parser=<parser>".'
      );
    }
    const demoted: Record<string, unknown> = { ...payload };
    delete demoted.tools;
    delete demoted.tool_choice;
    bodyJson = JSON.stringify(demoted);
    response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(timeoutMs),
        body: bodyJson,
      },
      `${this.providerName}:${this.model} (tools-stripped)`
    );
    return response;
  }

  /** Detect whether a 400 implies a tool_choice configuration problem. */
  static isToolChoiceRejection(status: number, body: string): boolean {
    if (status !== 400) return false;
    return /enable-auto-tool-choice|tool-call-parser|tool choice requires/i.test(body);
  }

  /** OpenAI-compatible streaming via SSE */
  private async *_streamOpenAICompatible(
    messages: LLMMessage[],
    options: LLMOptions
  ): AsyncGenerator<string, void, unknown> {
    const payload: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      stream: true,
    };
    const reasoningEffort = this.neuralwattReasoningEffort();
    if (reasoningEffort) {
      payload.reasoning_effort = reasoningEffort;
    }
    applyToolPayload(payload, this.supportsToolChoice, options, this._builtinToolsProvider);

    const response = await this._postWithToolRetry(
      payload,
      options,
      options.timeoutMs ?? defaultProviderTimeoutMs()
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM provider streaming error (${response.status}): ${error}`);
    }

    if (!response.body) {
      throw new Error('Streaming response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6).trim();
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
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

  private neuralwattReasoningEffort(): string | undefined {
    const fromEnv = (this.getEnv('NEURALWATT_REASONING_EFFORT') || '').trim().toLowerCase();
    if (fromEnv && ['low', 'medium', 'high'].includes(fromEnv)) return fromEnv;

    const active = this.providers.find(
      (p) => p.model === this.model && p.endpoint === this.baseUrl
    );
    const fromProvider = (active?.reasoningEffort || '').trim().toLowerCase();
    if (fromProvider && ['low', 'medium', 'high'].includes(fromProvider)) return fromProvider;

    if (this.detectProviderFromUrl(this.baseUrl) === 'neuralwatt' && this.model === 'glm-5.2') {
      return 'high';
    }
    return undefined;
  }

  /** OpenAI-compatible chat/completions endpoint (NVIDIA, Groq, OpenRouter, etc.) */
  private async callOpenAICompatible(messages: LLMMessage[], options: LLMOptions): Promise<string> {
    const payload: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
    };
    const reasoningEffort = this.neuralwattReasoningEffort();
    if (reasoningEffort) {
      payload.reasoning_effort = reasoningEffort;
    }
    applyToolPayload(payload, this.supportsToolChoice, options, this._builtinToolsProvider);

    const response = await this._postWithToolRetry(
      payload,
      options,
      options.timeoutMs ?? defaultProviderTimeoutMs()
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM provider error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as any;
    const choice = data.choices?.[0]?.message;
    // Some models (e.g. GPT-OSS-120B, reasoning models) put output in
    // reasoning_content when content is null. Fall back gracefully.
    return choice?.content || choice?.reasoning_content || choice?.reasoning || '';
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
        signal: AbortSignal.timeout(options.timeoutMs ?? defaultProviderTimeoutMs()),
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
  /**
   * Raw-response twin of _tryFallbacks for the tool-calling loop: try the
   * current provider, then walk the fallback chain, returning the first
   * successful RAW response (tool_calls intact). On success via a fallback,
   * the client stays switched to that provider (same sticky behavior as
   * _tryFallbacks). Throws only if every provider throws; returns the last
   * not-ok response otherwise so the caller's `!response.ok` handling runs.
   */
  private async _callProviderRawWithFallbacks(
    messages: LLMMessage[],
    options: LLMOptions
  ): Promise<{ ok: boolean; body: unknown }> {
    let lastNotOk: { ok: boolean; body: unknown } | null = null;
    try {
      const primary = await this._callProviderRaw(messages, options);
      if (primary.ok) return primary;
      lastNotOk = primary;
    } catch {
      // fall through to fallback chain
    }

    const sorted = [...this.providers].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    const tried = new Set([`${this.baseUrl}::${this.model}`]);

    for (const provider of sorted) {
      const providerAttemptKey = `${provider.endpoint}::${provider.model}`;
      if (tried.has(providerAttemptKey)) continue;
      tried.add(providerAttemptKey);
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
        const result = await this._callProviderRaw(messages, options);
        if (result.ok) {
          console.log(`[tnf] Tool-call fallback succeeded: ${provider.name} (${provider.model})`);
          return result;
        }
        lastNotOk = result;
        this.baseUrl = savedBaseUrl;
        this.apiKey = savedApiKey;
        this.model = savedModel;
        this.providerName = savedProvider;
      } catch {
        this.baseUrl = savedBaseUrl;
        this.apiKey = savedApiKey;
        this.model = savedModel;
        this.providerName = savedProvider;
      }
    }

    if (lastNotOk) return lastNotOk;
    throw new Error('All providers failed (thrown) during tool-calling raw call');
  }

  private async _tryFallbacks(
    messages: LLMMessage[],
    options: LLMOptions,
    primaryError: any
  ): Promise<string | null> {
    if (this.providers.length === 0) return null;

    const sorted = [...this.providers].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

    // Skip only exact endpoint/model pairs. A 404/function-missing response can
    // be model-specific, so the same endpoint may still recover with a
    // different catalog model.
    const tried = new Set([`${this.baseUrl}::${this.model}`]);

    for (const provider of sorted) {
      const providerAttemptKey = `${provider.endpoint}::${provider.model}`;
      if (tried.has(providerAttemptKey)) continue;
      tried.add(providerAttemptKey);

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
