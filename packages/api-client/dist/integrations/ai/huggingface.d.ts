import { Integration, IntegrationType, IntegrationConfig } from '../types.js';
/**
 * Hugging Face integration configuration
 */
export interface HuggingFaceConfig extends IntegrationConfig {
    apiKey?: string;
    model?: string;
    useInferenceEndpoint?: boolean;
}
/**
 * Hugging Face integration for accessing AI models
 */
export declare class HuggingFaceIntegration implements Integration {
    id: string;
    name: string;
    type: IntegrationType;
    description?: string;
    config: HuggingFaceConfig;
    capabilities: {
        actions: string[];
        [key: string]: any;
    };
    isConnected: boolean;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    private apiClient;
    constructor(config: HuggingFaceConfig);
    /**
     * Connect to Hugging Face API (verify API key)
     */
    connect(): Promise<boolean>;
    /**
     * Disconnect from Hugging Face (no specific action needed, just update status)
     */
    disconnect(): Promise<boolean>;
    /**
     * Execute a Hugging Face action
     */
    execute(action: string, params: Record<string, any>): Promise<any>;
    /**
     * Run inference on a specified model
     */
    private runInference;
    /**
     * Get metadata about this integration
     */
    getMetadata(): Promise<Record<string, any>>;
}
/**
 * Create a new Hugging Face integration
 */
export declare function createHuggingFaceIntegration(config?: Partial<HuggingFaceConfig>): HuggingFaceIntegration;
//# sourceMappingURL=huggingface.d.ts.map