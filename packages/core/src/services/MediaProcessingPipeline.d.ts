/**
 * Media Processing Pipeline
 *
 * Handles format conversion, optimization, and storage for generated media
 *
 * @module MediaProcessingPipeline
 * @since 2025-10-06
 */
import { MediaOutput, MediaType } from './GenerativeMediaProviderRegistry';
export interface ProcessingOptions {
    optimize?: boolean;
    format?: string;
    quality?: number;
    maxSize?: number;
    watermark?: {
        text?: string;
        image?: string;
        position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
        opacity?: number;
    };
    thumbnail?: {
        generate?: boolean;
        width?: number;
        height?: number;
    };
}
export interface ProcessedMedia extends MediaOutput {
    originalUrl: string;
    processedUrl: string;
    optimized: boolean;
    compressionRatio?: number;
    processingTime: number;
}
export declare class MediaProcessingPipeline {
    private storageProvider;
    private imageProcessor;
    private videoProcessor;
    private audioProcessor;
    constructor(storageProvider: StorageProvider, imageProcessor?: ImageProcessor, videoProcessor?: VideoProcessor, audioProcessor?: AudioProcessor);
    /**
     * Process media output with specified options
     */
    processMedia(media: MediaOutput, mediaType: MediaType, options?: ProcessingOptions): Promise<ProcessedMedia>;
}
//# sourceMappingURL=MediaProcessingPipeline.d.ts.map