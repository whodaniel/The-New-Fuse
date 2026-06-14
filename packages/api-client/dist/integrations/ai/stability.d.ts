import { Integration, IntegrationType, IntegrationConfig } from '../types.js';
/**
 * Stability AI configuration
 */
export interface StabilityAIConfig extends IntegrationConfig {
    apiKey?: string;
    engine?: string;
    defaultSteps?: number;
    defaultCfgScale?: number;
    defaultWidth?: number;
    defaultHeight?: number;
}
/**
 * Stability AI integration for image generation capabilities
 */
export declare class StabilityAIIntegration implements Integration {
    id: string;
    name: string;
    type: IntegrationType;
    description?: string;
    config: StabilityAIConfig;
    capabilities: {
        actions: string[];
        dataTypes?: string[];
    };
    isConnected: boolean;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    private apiClient;
    constructor(config: StabilityAIConfig);
    /**
     * Connect to Stability API
     */
    connect(): Promise<boolean>;
    /**
     * Disconnect from Stability API
     */
    disconnect(): Promise<boolean>;
    /**
     * Execute a Stability AI action
     */
    execute(action: string, params: Record<string, any>): Promise<any>;
    /**
     * List available engines (models)
     */
    private listEngines;
    /**
     * Generate an image from a text prompt
     */
    private generateImageFromText;
    /**
     * Generate an image based on an existing image
     */
    private generateImageFromImage;
    /**
     * Upscale an image to a higher resolution
     */
    private upscaleImage;
    /**
     * Inpaint an image with a mask
     */
    private inpaintImage;
    /**
     * Create a mask from an image
     */
    private maskImage;
    /**
     * Get metadata about this integration
     */
    getMetadata(): Promise<Record<string, any>>;
}
/**
 * Create a new StabilityAI integration
 */
export declare function createStabilityAIIntegration(config?: Partial<StabilityAIConfig>): StabilityAIIntegration;
//# sourceMappingURL=stability.d.ts.map