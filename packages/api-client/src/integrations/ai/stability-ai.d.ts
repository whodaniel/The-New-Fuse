import { Integration, IntegrationType, IntegrationConfig } from '../types';
/**
 * Stability AI configuration
 */
export interface StabilityAIConfig extends IntegrationConfig {
    apiKey?: string;
    engine?: string;
    defaultWidth?: number;
    defaultHeight?: number;
    defaultCfgScale?: number;
    defaultSteps?: number;
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
        dataTypes: string[];
    };
    isConnected: boolean;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    private apiClient;
    constructor(config: StabilityAIConfig);
    /**
     * Generate an image from text prompt
     */
    private textToImage;
    /**
     * Generate an image from another image and text prompt
     */
    private imageToImage;
    /**
     * Inpainting (fill in parts of an image based on a mask)
     */
    private inpainting;
    /**
     * Masking (same as inpainting, different endpoint)
     */
    private masking;
    /**
     * List available engines
     */
    private listEngines;
    /**
     * Get a specific engine
     */
    private getEngine;
    /**
     * Convert a URL to base64
     * Note: In a real implementation, this would use fetch to get the image
     * For simplicity, we're assuming it's already in base64 format
     */
    private urlToBase64;
    /**
     * Get metadata about this integration
     */
    getMetadata(): Promise<Record<string, any>>;
}
/**
 * Create a new Stability AI integration
 */
export declare function createStabilityAIIntegration(config?: Partial<StabilityAIConfig>): StabilityAIIntegration;
//# sourceMappingURL=stability-ai.d.ts.map