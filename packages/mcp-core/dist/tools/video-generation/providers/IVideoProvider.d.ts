/**
 * Video Provider Interface
 *
 * Abstract interface for video diffusion model providers.
 * Implement this interface to add support for new video generation services.
 */
import { CostEstimate, VideoGenerationJob, VideoGenerationParams, VideoGenerationResult, VideoProvider, VideoProviderCapabilities } from '../types.js';
/**
 * Interface for video generation providers
 */
export interface IVideoProvider {
    /** Provider identifier */
    readonly name: VideoProvider;
    /** Human-readable provider name */
    readonly displayName: string;
    /** Provider description */
    readonly description: string;
    /** Whether the provider is currently available */
    isAvailable(): Promise<boolean>;
    /**
     * Get provider capabilities
     */
    getCapabilities(): VideoProviderCapabilities;
    /**
     * Validate API credentials
     */
    validateCredentials(): Promise<boolean>;
    /**
     * Estimate cost for a generation request
     */
    estimateCost(params: VideoGenerationParams): Promise<CostEstimate>;
    /**
     * Start a video generation job
     * Returns immediately with job info; use getJobStatus to poll for completion
     */
    generateVideo(params: VideoGenerationParams): Promise<VideoGenerationJob>;
    /**
     * Get current status of a generation job
     */
    getJobStatus(jobId: string): Promise<VideoGenerationJob>;
    /**
     * Cancel a pending or in-progress job
     */
    cancelJob(jobId: string): Promise<void>;
    /**
     * Wait for job completion, polling until done
     */
    waitForCompletion(jobId: string, options?: {
        pollIntervalMs?: number;
        maxWaitMs?: number;
        onProgress?: (job: VideoGenerationJob) => void;
    }): Promise<VideoGenerationResult>;
    /**
     * Download a generated video to a local path
     */
    downloadVideo(videoUrl: string, outputPath: string): Promise<string>;
}
/**
 * Base class for video providers with common functionality
 */
export declare abstract class BaseVideoProvider implements IVideoProvider {
    abstract readonly name: VideoProvider;
    abstract readonly displayName: string;
    abstract readonly description: string;
    protected apiKey: string;
    protected baseUrl: string;
    protected timeoutMs: number;
    protected maxRetries: number;
    constructor(config: {
        apiKey: string;
        baseUrl?: string;
        timeoutMs?: number;
        maxRetries?: number;
    });
    protected abstract getDefaultBaseUrl(): string;
    abstract getCapabilities(): VideoProviderCapabilities;
    abstract validateCredentials(): Promise<boolean>;
    abstract estimateCost(params: VideoGenerationParams): Promise<CostEstimate>;
    abstract generateVideo(params: VideoGenerationParams): Promise<VideoGenerationJob>;
    abstract getJobStatus(jobId: string): Promise<VideoGenerationJob>;
    abstract cancelJob(jobId: string): Promise<void>;
    isAvailable(): Promise<boolean>;
    downloadVideo(videoUrl: string, outputPath: string): Promise<string>;
    /**
     * Helper method for making authenticated API requests
     */
    protected apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T>;
    /**
     * Set authentication header (override in subclasses for different auth methods)
     */
    protected setAuthHeader(headers: Headers): void;
    /**
     * Generate a unique job ID
     */
    protected generateJobId(): string;
    /**
     * Poll for job completion
     */
    waitForCompletion(jobId: string, options?: {
        pollIntervalMs?: number;
        maxWaitMs?: number;
        onProgress?: (job: VideoGenerationJob) => void;
    }): Promise<VideoGenerationResult>;
}
//# sourceMappingURL=IVideoProvider.d.ts.map