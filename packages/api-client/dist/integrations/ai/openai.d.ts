import { Integration, IntegrationType, IntegrationConfig } from '../types.js';
/**
 * OpenAI integration configuration
 */
export interface OpenAIConfig extends IntegrationConfig {
    apiKey?: string;
    organization?: string;
    model?: string;
    defaultMaxTokens?: number;
    defaultTemperature?: number;
}
/**
 * OpenAI integration for accessing AI models like GPT
 */
export declare class OpenAIIntegration implements Integration {
    id: string;
    name: string;
    type: IntegrationType;
    description?: string;
    config: OpenAIConfig;
    capabilities: {
        actions: string[];
        [key: string]: any;
    };
    isConnected: boolean;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    private apiClient;
    constructor(config: OpenAIConfig);
    /**
     * Connect to OpenAI API (verify API key)
     */
    connect(): Promise<boolean>;
    /**
     * Disconnect from OpenAI (no specific action needed, just update status)
     */
    disconnect(): Promise<boolean>;
    /**
     * Execute an OpenAI action
     */
    execute(action: string, params: Record<string, any>): Promise<any>;
    /**
     * Create a chat completion
     */
    private createChatCompletion;
    /**
     * Create a legacy completion
     */
    private createCompletion;
    /**
     * Create an embedding
     */
    private createEmbedding;
    /**
    * List available models
    */
    private listModels;
    /**
     * Get metadata about this integration
     */
    getMetadata(): Promise<Record<string, any>>;
}
/**
 * Create a new OpenAI integration
 */
export declare function createOpenAIIntegration(config?: Partial<OpenAIConfig>): OpenAIIntegration;
//# sourceMappingURL=openai.d.ts.map