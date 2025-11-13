import { Integration, IntegrationType, IntegrationConfig } from '../types';
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
     * Create a chat completion
     */
    private createChatCompletion;
    /**
     * Create a legacy completion
     */
    private createCompletion;
}
//# sourceMappingURL=openai.d.ts.map