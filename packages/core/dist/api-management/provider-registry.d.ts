import { EventEmitter } from 'events';
export interface ModelInfo {
    id: string;
    name: string;
    description?: string;
    contextLength?: number;
    inputPricing?: number;
    outputPricing?: number;
}
export interface ProviderInfo {
    id: string;
    name: string;
    baseUrl: string;
    apiKeyRequired?: boolean;
    models: ModelInfo[];
    supportedFeatures?: string[];
}
export declare class ProviderRegistry extends EventEmitter {
    private providers;
    constructor();
    registerProvider(provider: ProviderInfo): void;
    unregisterProvider(providerId: string): boolean;
    getProvider(providerId: string): ProviderInfo | undefined;
    getAllProviders(): ProviderInfo[];
    getProviderModels(providerId: string): ModelInfo[];
    findModelById(modelId: string): {
        provider: ProviderInfo;
        model: ModelInfo;
    } | undefined;
    private initializeDefaultProviders;
    updateProvider(providerId: string, updates: Partial<ProviderInfo>): boolean;
    isProviderRegistered(providerId: string): boolean;
    getProviderCount(): number;
}
//# sourceMappingURL=provider-registry.d.ts.map