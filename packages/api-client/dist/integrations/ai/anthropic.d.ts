import { Integration, IntegrationType, IntegrationConfig } from '../types.js';
/**
 * Anthropic API configuration
 */
export interface AnthropicConfig extends IntegrationConfig {
    apiKey?: string;
    model?: string;
    defaultMaxTokens?: number;
    defaultTemperature?: number;
    defaultTopP?: number;
    defaultTopK?: number;
    anthropicVersion?: string;
}
/**
 * Anthropic integration for AI capabilities (Claude models)
 */
export declare class AnthropicIntegration implements Integration {
    id: string;
    name: string;
    type: IntegrationType;
    description?: string;
    config: AnthropicConfig;
    capabilities: {
        actions: string[];
        [key: string]: any;
    };
    isConnected: boolean;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    private apiClient;
    constructor(config: AnthropicConfig);
    /**
     * Connect to Anthropic API (verify API key)
     */
    connect(): Promise<boolean>;
    /**
     * Disconnect from Anthropic API (no specific action needed, just update status)
     */
    disconnect(): Promise<boolean>;
    /**
     * Execute an Anthropic action
     */
    execute(action: string, params?: Record<string, any>): Promise<any>;
    /**
     * Create a chat completion using the Messages API
     */
    private createChatCompletion;
    /**
    * List known Anthropic models (as there's no API endpoint)
    */
    private listKnownModels;
    /**
     * Get metadata about this integration
     */
    getMetadata(): Promise<Record<string, any>>;
}
/**
 * Create a new Anthropic integration
 */
export declare function createAnthropicIntegration(config?: Partial<AnthropicConfig>): AnthropicIntegration;
//# sourceMappingURL=anthropic.d.ts.map