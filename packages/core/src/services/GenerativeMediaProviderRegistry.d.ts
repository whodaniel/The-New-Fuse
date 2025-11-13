/**
 * Generative Media Provider Registry
 *
 * Unified registry for image, video, and audio generation models
 * Extends the LLM provider pattern for multimodal AI
 *
 * @module GenerativeMediaProviderRegistry
 * @since 2025-10-06
 */
export declare enum MediaType {
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio",
    MUSIC = "music",
    VOICE = "voice"
}
export declare enum MediaProviderType {
    API_DIRECT = "api_direct",
    REPLICATE = "replicate",
    HUGGING_FACE = "hugging_face",
    SELF_HOSTED = "self_hosted",
    DISCORD_BOT = "discord_bot"
}
export interface MediaProviderConfig {
    id: string;
    name: string;
    displayName: string;
    type: MediaProviderType;
    mediaTypes: MediaType[];
    endpoint: string;
    apiKey?: string;
    models: MediaModel[];
    capabilities: MediaCapability[];
    pricing: PricingInfo;
    priority: number;
    status: 'available' | 'unavailable' | 'checking';
    metadata: {
        vendor: string;
        version?: string;
        description: string;
        documentation?: string;
        tags: string[];
        maxDimensions?: {
            width: number;
            height: number;
        };
        maxDuration?: number;
        supportedFormats?: string[];
    };
}
export interface MediaModel {
    id: string;
    name: string;
    mediaType: MediaType;
    description: string;
    maxResolution?: string;
    maxDuration?: number;
    pricing: PricingInfo;
}
export interface MediaCapability {
    name: string;
    description: string;
    supported: boolean;
    mediaTypes: MediaType[];
}
export interface PricingInfo {
    model: 'per_generation' | 'per_second' | 'per_character' | 'subscription';
    cost: number;
    currency: 'USD';
    unit: string;
    freeCredits?: number;
}
export interface MediaGenerationRequest {
    prompt: string;
    mediaType: MediaType;
    providerId?: string;
    model?: string;
    parameters?: {
        width?: number;
        height?: number;
        style?: string;
        aspectRatio?: string;
        duration?: number;
        fps?: number;
        motionStrength?: number;
        voice?: string;
        speed?: number;
        emotion?: string;
        genre?: string;
        seed?: number;
        guidance?: number;
        steps?: number;
    };
    options?: {
        timeout?: number;
        retryOnFailure?: boolean;
        fallbackProviders?: string[];
        outputFormat?: string;
    };
}
export interface MediaGenerationResult {
    success: boolean;
    mediaType: MediaType;
    providerId: string;
    model: string;
    outputs: MediaOutput[];
    metadata: {
        generationTime: number;
        cost?: number;
        parameters: any;
        error?: string;
    };
}
export interface MediaOutput {
    url: string;
    format: string;
    dimensions?: {
        width: number;
        height: number;
    };
    duration?: number;
    size: number;
    thumbnail?: string;
}
export declare class GenerativeMediaProviderRegistry {
    private providers;
    private logger;
    constructor();
    /**
     * Register a new media provider
     */
    registerProvider(config: MediaProviderConfig): Promise<void>;
    const providerId: any;
}
//# sourceMappingURL=GenerativeMediaProviderRegistry.d.ts.map