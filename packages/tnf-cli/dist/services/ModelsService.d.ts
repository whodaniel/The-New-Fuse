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
export declare class ModelsService {
    private modelsCachePath;
    private defaultModelPath;
    private cacheExpiry;
    constructor(cachePath?: string);
    listProviders(): Promise<ModelProvider[]>;
    listModels(providerId?: string, options?: {
        refresh?: boolean;
        verbose?: boolean;
    }): Promise<ModelInfo[]>;
    private fetchModels;
    private loadCache;
    private saveCache;
    refreshCache(): Promise<ModelInfo[]>;
    setDefaultModel(provider: string, model: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getDefaultModel(): Promise<{
        provider: string;
        model: string;
    }>;
}
//# sourceMappingURL=ModelsService.d.ts.map