/**
 * LLM Provider Controller
 *
 * REST API endpoints for managing and accessing LLM providers through the unified registry.
 * Provides endpoints for provider discovery, configuration, and execution.
 *
 * @module LLMProviderController
 * @since 2025-10-06
 */
interface LLMProviderConfig {
    id: string;
    name: string;
    type: string;
    status: string;
}
interface LLMProviderExecutionResult {
    success: boolean;
    content?: string;
    error?: string;
}
export declare class LLMProviderQueryDto {
    type?: string;
    status?: string;
    capability?: string;
    tags?: string[];
    category?: string;
}
export declare class LLMExecutionRequestDto {
    prompt: string;
    providerId?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    timeout?: number;
    retryOnFailure?: boolean;
    fallbackProviders?: string[];
    preferredType?: string;
    requiredCapability?: string;
}
export declare class LLMProviderConfigDto {
    id: string;
    name: string;
    displayName: string;
    type: string;
    status?: string;
    endpoint?: string;
    apiKey?: string;
    command?: string;
    defaultModel: string;
    availableModels: string[];
    capabilities: Array<{
        name: string;
        description: string;
        supported: boolean;
    }>;
    priority: number;
    metadata: {
        vendor: string;
        version?: string;
        description: string;
        documentation?: string;
        tags: string[];
    };
}
export declare class LLMProviderController {
    private readonly providerRegistry;
    private readonly liteLLMService;
    private readonly logger;
    constructor(providerRegistry?: any, liteLLMService?: any);
    getProviders(query: LLMProviderQueryDto): Promise<LLMProviderConfig[]>;
    getProvider(id: string): Promise<LLMProviderConfig>;
    updateProviderStatus(id: string, body: {
        status: string;
        error?: string;
    }): Promise<{
        message: string;
    }>;
    executeRequest(request: LLMExecutionRequestDto): Promise<LLMProviderExecutionResult>;
    executeWithProvider(providerId: string, request: Omit<LLMExecutionRequestDto, 'providerId'>): Promise<LLMProviderExecutionResult>;
}
export {};
//# sourceMappingURL=LLMProviderController.d.ts.map