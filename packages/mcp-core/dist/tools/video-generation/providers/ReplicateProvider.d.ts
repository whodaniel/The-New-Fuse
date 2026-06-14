/**
 * Replicate Provider for Video Generation
 *
 * Replicate provides a unified API for running multiple video diffusion models
 * including Stable Video Diffusion, AnimateDiff, and more.
 *
 * @see https://replicate.com/docs
 */
import { CostEstimate, VideoGenerationJob, VideoGenerationParams, VideoProvider, VideoProviderCapabilities } from '../types.js';
import { BaseVideoProvider } from './IVideoProvider.js';
export declare class ReplicateProvider extends BaseVideoProvider {
    readonly name: VideoProvider;
    readonly displayName = "Replicate";
    readonly description = "Run multiple video AI models through a unified API";
    private pendingJobs;
    protected getDefaultBaseUrl(): string;
    getCapabilities(): VideoProviderCapabilities;
    validateCredentials(): Promise<boolean>;
    estimateCost(params: VideoGenerationParams): Promise<CostEstimate>;
    generateVideo(params: VideoGenerationParams): Promise<VideoGenerationJob>;
    getJobStatus(jobId: string): Promise<VideoGenerationJob>;
    cancelJob(jobId: string): Promise<void>;
    protected setAuthHeader(headers: Headers): void;
    private selectModel;
    private buildModelInput;
    private mapMotionAmount;
    private calculateFrameCount;
    private getWidth;
    private getHeight;
    private mapPredictionToJob;
    private createVideoFromUrl;
}
export default ReplicateProvider;
//# sourceMappingURL=ReplicateProvider.d.ts.map