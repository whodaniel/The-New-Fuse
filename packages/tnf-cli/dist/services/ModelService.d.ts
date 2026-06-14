export interface ModelConfig {
    id: string;
    name: string;
    provider: string;
    model: string;
    apiKeyEnv: string;
    apiBase?: string;
    enabled: boolean;
    isDefault: boolean;
    costPer1K?: number;
    maxTokens?: number;
    supportsVision?: boolean;
    supportsFunctionCalling?: boolean;
    latency?: number;
    description?: string;
}
export interface ProviderInfo {
    name: string;
    type: 'openai' | 'anthropic' | 'openrouter' | 'local' | 'custom';
    baseUrl?: string;
    authType: 'api-key' | 'oauth' | 'none';
    rateLimitLimit?: number;
    rateLimitRemaining?: number;
    status: 'active' | 'exhausted' | 'error' | 'disabled';
    lastUsed?: string;
    models: ModelConfig[];
}
export declare class ModelService {
    private configDir;
    private modelsFile;
    private providersFile;
    constructor();
    private ensureDefaults;
    private defaultModels;
    private defaultProviders;
    private loadModels;
    private saveModels;
    private loadProviders;
    private saveProviders;
    listModels(): Promise<ModelConfig[]>;
    getModel(id: string): Promise<ModelConfig | undefined>;
    getDefaultModel(): Promise<ModelConfig | undefined>;
    setDefault(modelId: string): Promise<ModelConfig | null>;
    addModel(config: Omit<ModelConfig, 'id'>): Promise<ModelConfig>;
    removeModel(modelId: string): Promise<boolean>;
    getFallbackChain(): Promise<ModelConfig[]>;
    addToFallback(modelId: string): Promise<boolean>;
    removeFromFallback(modelId: string): Promise<boolean>;
    getProviderStatus(): Promise<ProviderInfo[]>;
    testProvider(provider: string): Promise<{
        status: string;
        latency: number;
    }>;
}
//# sourceMappingURL=ModelService.d.ts.map