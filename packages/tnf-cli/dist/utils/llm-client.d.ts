export interface LLMMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface LLMOptions {
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
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
    provider?: string;
    reasoningEffort?: string;
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
export declare class LLMClient {
    private apiKey;
    baseUrl: string;
    model: string;
    providerName: string;
    private readonly role;
    private envVars;
    private providers;
    constructor(role?: 'orchestrator' | 'worker' | 'reviewer' | 'subagent');
    /** Static async factory for proper async initialization */
    static create(role?: 'orchestrator' | 'worker' | 'reviewer' | 'subagent'): Promise<LLMClient>;
    /** Load .env / .env.local from repo root into this.envVars (not process.env) */
    private loadEnv;
    private getEnv;
    /** Load the provider catalog from model-providers.json files */
    private loadProviders;
    /** Resolve the LLM provider configuration. Returns a promise that resolves when resolution is complete. */
    resolveProvider(): Promise<void>;
    /** Detect provider name from URL pattern */
    private detectProviderFromUrl;
    /** Resolve the API key for a provider descriptor */
    private resolveApiKey;
    /** Rough liveness check — true if we have no evidence the provider is dead */
    private isProviderAlive;
    chatComplete(messages: LLMMessage[], options?: LLMOptions): Promise<string>;
    /**
     * Streaming chat completion — yields response chunks as they arrive.
     * Falls back to non-streaming if streaming is not supported.
     */
    chatStream(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string, void, unknown>;
    /** OpenAI-compatible streaming via SSE */
    private _streamOpenAICompatible;
    /** Route to the correct API format for the current baseUrl */
    private _callProvider;
    private neuralwattReasoningEffort;
    /** OpenAI-compatible chat/completions endpoint (NVIDIA, Groq, OpenRouter, etc.) */
    private callOpenAICompatible;
    /** Gemini native API (generateContent endpoint) */
    private callGemini;
    /** Try remaining providers from the catalog when the primary fails */
    private _tryFallbacks;
    fetchAvailableModels(): Promise<string[]>;
    /** Return all configured providers with their status */
    getProviderCatalog(): {
        id: string;
        name: string;
        model: string;
        hasKey: boolean;
    }[];
}
//# sourceMappingURL=llm-client.d.ts.map