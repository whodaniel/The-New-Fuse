/**
 * Enhanced LiteLLM Service
 *
 * Comprehensive LiteLLM integration supporting 100+ LLM providers through LiteLLM proxy.
 * Provides unified access to all major LLM providers with advanced features.
 *
 * @module EnhancedLiteLLMService
 * @since 2025-10-06
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface LiteLLMProviderDefinition {
    id: string;
    name: string;
    vendor: string;
    category: 'major' | 'specialized' | 'local' | 'enterprise' | 'experimental';
    models: string[];
    requiresApiKey: boolean;
    supportedFeatures: string[];
    costTier: 'free' | 'low' | 'medium' | 'high' | 'enterprise';
    documentation?: string;
    setupInstructions?: string;
}
export interface LiteLLMConfig {
    baseURL: string;
    apiKey?: string;
    masterKey?: string;
    timeout: number;
    maxRetries: number;
    enableFallback: boolean;
    fallbackModels: string[];
    enableCaching: boolean;
    cacheType: 'memory' | 'redis' | 'sqlite';
    enableBudgetTracking: boolean;
    budgetLimit?: number;
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}
export declare class EnhancedLiteLLMService {
    private readonly eventEmitter;
    private readonly logger;
    private config;
    private availableProviders;
    constructor(eventEmitter: EventEmitter2);
    /**
     * Get all supported LiteLLM providers
     */
    getSupportedProviders(): LiteLLMProviderDefinition[];
    /**
     * Get providers by category
     */
    getProvidersByCategory(category: string): LiteLLMProviderDefinition[];
    /**
     * Get major/popular providers
     */
    getMajorProviders(): LiteLLMProviderDefinition[];
    /**
     * Get all available models from LiteLLM proxy
     */
    getAvailableModels(): Promise<string[]>;
    catch(error: any): never[];
}
//# sourceMappingURL=EnhancedLiteLLMService.d.ts.map