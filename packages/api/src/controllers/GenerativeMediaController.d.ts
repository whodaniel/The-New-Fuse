/**
 * Generative Media Controller
 *
 * REST API endpoints for image, video, and audio generation
 *
 * @module GenerativeMediaController
 * @since 2025-10-06
 */
interface MediaGenerationRequest {
    prompt: string;
    mediaType: 'image' | 'video' | 'audio' | 'music' | 'voice';
    providerId?: string;
    model?: string;
    parameters?: {
        width?: number;
        height?: number;
        duration?: number;
        style?: string;
        voice?: string;
        genre?: string;
        seed?: number;
    };
    options?: {
        timeout?: number;
        retryOnFailure?: boolean;
        fallbackProviders?: string[];
        outputFormat?: string;
    };
}
interface MediaGenerationResult {
    success: boolean;
    mediaType: string;
    providerId: string;
    model: string;
    outputs: Array<{
        url: string;
        format: string;
        dimensions?: {
            width: number;
            height: number;
        };
        duration?: number;
        size: number;
        thumbnail?: string;
    }>;
    metadata: {
        generationTime: number;
        cost?: number;
        parameters: any;
        error?: string;
    };
}
export declare class GenerativeMediaController {
    private readonly mediaRegistry;
    constructor(mediaRegistry?: any);
    getProviders(mediaType?: string): Promise<{
        success: boolean;
        count: any;
        mediaType: string;
        providers: any;
    }>;
    generateMedia(request: MediaGenerationRequest): Promise<MediaGenerationResult>;
    generateWithProvider(providerId: string, request: MediaGenerationRequest): Promise<MediaGenerationResult>;
}
export {};
//# sourceMappingURL=GenerativeMediaController.d.ts.map