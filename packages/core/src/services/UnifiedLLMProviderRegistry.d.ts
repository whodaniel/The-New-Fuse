/**
 * Unified LLM Provider Registry
 *
 * Centralized registry for all LLM providers across The New Fuse framework.
 * Supports CLI agents, API providers, custom agents, and LiteLLM proxy providers.
 *
 * @module UnifiedLLMProviderRegistry
 * @since 2025-10-06
 */
import { OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare enum LLMProviderType {
    CLI_AGENT = "cli_agent",
    API_DIRECT = "api_direct",
    LITELLM_PROXY = "litellm_proxy",
    LOCAL_SERVER = "local_server",
    CUSTOM_AGENT = "custom_agent",
    MCP_INTEGRATED = "mcp_integrated"
}
export declare enum LLMProviderStatus {
    AVAILABLE = "available",
    UNAVAILABLE = "unavailable",
    CHECKING = "checking",
    ERROR = "error",
    DISABLED = "disabled"
}
export interface LLMProviderCapability {
    name: string;
    description: string;
    supported: boolean;
    metadata?: Record<string, any>;
}
export interface LLMProviderConfig {
    id: string;
    name: string;
    displayName: string;
    type: LLMProviderType;
    status: LLMProviderStatus;
    endpoint?: string;
    apiKey?: string;
    command?: string;
    defaultModel: string;
    availableModels: string[];
    capabilities: LLMProviderCapability[];
    priority: number;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
    retryConfig?: {
        maxAttempts: number;
        initialDelay: number;
        backoffMultiplier: number;
    };
    costPerToken?: number;
    rateLimit?: {
        requestsPerMinute: number;
        tokensPerMinute: number;
    };
    metadata: {
        vendor: string;
        version?: string;
        description: string;
        documentation?: string;
        tags: string[];
        lastHealthCheck?: Date;
        healthCheckInterval?: number;
    };
}
export interface LLMProviderExecutionContext {
    providerId: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    timeout?: number;
    retryOnFailure?: boolean;
    fallbackProviders?: string[];
}
export interface LLMProviderExecutionResult {
    success: boolean;
    content?: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        cost?: number;
    };
    metadata: {
        providerId: string;
        model: string;
        latency: number;
        timestamp: Date;
    };
    error?: string;
}
export declare class UnifiedLLMProviderRegistry extends EventEmitter2 implements OnModuleInit {
    private readonly logger;
    private providers;
    private healthCheckIntervals;
    constructor();
    onModuleInit(): Promise<void>;
    /**
     * Register a new LLM provider
     */
    registerProvider(config: LLMProviderConfig): Promise<void>;
    if(provider: any, status: any): any;
}
//# sourceMappingURL=UnifiedLLMProviderRegistry.d.ts.map