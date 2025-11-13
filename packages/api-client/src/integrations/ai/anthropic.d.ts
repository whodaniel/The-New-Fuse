import { Integration, IntegrationType, IntegrationConfig } from '../types';
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
    default: throw;
}
/**
 * Create a new Anthropic integration
 */
export declare function createAnthropicIntegration(config?: Partial<AnthropicConfig>): AnthropicIntegration;
//# sourceMappingURL=anthropic.d.ts.map