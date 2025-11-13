import { Integration, IntegrationType, IntegrationConfig } from '../types';
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
     * Inpaint an image with a mask
     */
    private inpaintImage;
}
//# sourceMappingURL=stability.d.ts.map