/**
 * Replicate Provider for Video Generation
 *
 * Replicate provides a unified API for running multiple video diffusion models
 * including Stable Video Diffusion, AnimateDiff, and more.
 *
 * @see https://replicate.com/docs
 */

import {
  CostEstimate,
  GeneratedVideo,
  VideoGenerationJob,
  VideoGenerationParams,
  VideoJobStatus,
  VideoProvider,
  VideoProviderCapabilities,
} from '../types.js';
import { BaseVideoProvider } from './IVideoProvider.js';

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  input: Record<string, unknown>;
  output: string | string[] | null;
  error: string | null;
  logs: string | null;
  metrics?: {
    predict_time?: number;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * Map of popular video models on Replicate
 */
const REPLICATE_VIDEO_MODELS: Record<string, { owner: string; name: string; version?: string }> = {
  svd: {
    owner: 'stability-ai',
    name: 'stable-video-diffusion',
  },
  'svd-xt': {
    owner: 'stability-ai',
    name: 'stable-video-diffusion',
  },
  animatediff: {
    owner: 'lucataco',
    name: 'animate-diff',
  },
  zeroscope: {
    owner: 'anotherjesse',
    name: 'zeroscope-v2-xl',
  },
  modelscope: {
    owner: 'deforum',
    name: 'deforum_stable_diffusion',
  },
};

export class ReplicateProvider extends BaseVideoProvider {
  readonly name: VideoProvider = 'replicate';
  readonly displayName = 'Replicate';
  readonly description = 'Run multiple video AI models through a unified API';

  private pendingJobs: Map<string, string> = new Map(); // jobId -> replicateId

  protected getDefaultBaseUrl(): string {
    return 'https://api.replicate.com/v1';
  }

  getCapabilities(): VideoProviderCapabilities {
    return {
      inputTypes: ['text', 'image'],
      models: [
        {
          id: 'svd',
          name: 'Stable Video Diffusion',
          description: 'High-quality image-to-video generation',
          isDefault: true,
          quality: 'high',
          speed: 'standard',
          inputTypes: ['image'],
        },
        {
          id: 'svd-xt',
          name: 'Stable Video Diffusion XT',
          description: 'Extended version with longer video support',
          quality: 'high',
          speed: 'slow',
          inputTypes: ['image'],
        },
        {
          id: 'animatediff',
          name: 'AnimateDiff',
          description: 'Text-to-video and image animation',
          quality: 'standard',
          speed: 'standard',
          inputTypes: ['text', 'image'],
        },
        {
          id: 'zeroscope',
          name: 'Zeroscope V2 XL',
          description: 'High-resolution text-to-video',
          quality: 'high',
          speed: 'slow',
          inputTypes: ['text'],
        },
      ],
      aspectRatios: ['16:9', '9:16', '1:1'],
      resolutions: ['720p', '1080p'],
      durationLimits: {
        min: 2,
        max: 8,
        default: 4,
      },
      supportsAudio: false,
      supportsCameraMotion: true,
      supportsStyles: true,
      maxVideosPerRequest: 1,
      rateLimits: {
        requestsPerMinute: 60,
      },
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.apiRequest('/models');
      return true;
    } catch {
      return false;
    }
  }

  async estimateCost(params: VideoGenerationParams): Promise<CostEstimate> {
    // Replicate charges per second of compute time
    // Video models typically take 30-120 seconds
    const estimatedSeconds = params.duration && params.duration > 4 ? 90 : 45;
    const costPerSecond = 0.0023; // Approximate for GPU instances

    return {
      usd: estimatedSeconds * costPerSecond,
      isExact: false,
      breakdown: [
        {
          component: 'GPU compute',
          quantity: estimatedSeconds,
          unit: 'seconds',
          unitCost: costPerSecond,
          totalCost: estimatedSeconds * costPerSecond,
        },
      ],
    };
  }

  async generateVideo(params: VideoGenerationParams): Promise<VideoGenerationJob> {
    const jobId = this.generateJobId();

    // Select model based on input type and params
    const modelInfo = this.selectModel(params);

    // Build input based on model
    const input = this.buildModelInput(params, modelInfo.id);

    // Start prediction
    const prediction = await this.apiRequest<ReplicatePrediction>('/predictions', {
      method: 'POST',
      body: JSON.stringify({
        version: modelInfo.version,
        input,
      }),
    });

    // Store mapping
    this.pendingJobs.set(jobId, prediction.id);

    return this.mapPredictionToJob(jobId, prediction, params);
  }

  async getJobStatus(jobId: string): Promise<VideoGenerationJob> {
    const replicateId = this.pendingJobs.get(jobId);
    if (!replicateId) {
      throw new Error(`Unknown job ID: ${jobId}`);
    }

    const prediction = await this.apiRequest<ReplicatePrediction>(`/predictions/${replicateId}`);

    // Get original params (would need to store these properly in production)
    const params = {} as VideoGenerationParams;

    return this.mapPredictionToJob(jobId, prediction, params);
  }

  async cancelJob(jobId: string): Promise<void> {
    const replicateId = this.pendingJobs.get(jobId);
    if (!replicateId) {
      throw new Error(`Unknown job ID: ${jobId}`);
    }

    await this.apiRequest(`/predictions/${replicateId}/cancel`, {
      method: 'POST',
    });

    this.pendingJobs.delete(jobId);
  }

  protected setAuthHeader(headers: Headers): void {
    headers.set('Authorization', `Token ${this.apiKey}`);
  }

  private selectModel(params: VideoGenerationParams): { id: string; version?: string } {
    const requestedModel = params.model || 'svd';
    const modelInfo = REPLICATE_VIDEO_MODELS[requestedModel];

    if (!modelInfo) {
      // Default to SVD
      return { id: 'svd' };
    }

    return {
      id: requestedModel,
      version: modelInfo.version,
    };
  }

  private buildModelInput(params: VideoGenerationParams, modelId: string): Record<string, unknown> {
    const baseInput: Record<string, unknown> = {};

    switch (modelId) {
      case 'svd':
      case 'svd-xt':
        // Stable Video Diffusion - image to video
        if (!params.inputImageUrl && !params.inputImageBase64) {
          throw new Error('SVD requires an input image');
        }
        return {
          input_image: params.inputImageUrl || params.inputImageBase64,
          motion_bucket_id: this.mapMotionAmount(params.motionAmount),
          fps: params.fps || 24,
          cond_aug: 0.02,
          decoding_t: 14,
          seed: params.seed,
        };

      case 'animatediff':
        return {
          prompt: params.prompt,
          negative_prompt: params.negativePrompt || '',
          num_frames: this.calculateFrameCount(params.duration || 4, params.fps || 24),
          guidance_scale: params.guidanceScale || 7.5,
          seed: params.seed,
        };

      case 'zeroscope':
        return {
          prompt: params.prompt,
          negative_prompt: params.negativePrompt,
          num_frames: this.calculateFrameCount(params.duration || 4, params.fps || 24),
          fps: params.fps || 24,
          width: this.getWidth(params.aspectRatio, params.resolution),
          height: this.getHeight(params.aspectRatio, params.resolution),
          seed: params.seed,
        };

      default:
        return {
          prompt: params.prompt,
          ...baseInput,
        };
    }
  }

  private mapMotionAmount(motion?: 'low' | 'medium' | 'high' | 'auto'): number {
    switch (motion) {
      case 'low':
        return 50;
      case 'medium':
        return 127;
      case 'high':
        return 200;
      default:
        return 127;
    }
  }

  private calculateFrameCount(duration: number, fps: number): number {
    return Math.min(Math.round(duration * fps), 128); // Most models cap at 128 frames
  }

  private getWidth(aspectRatio?: string, resolution?: string): number {
    const baseWidth = resolution === '1080p' ? 1920 : 1280;
    switch (aspectRatio) {
      case '9:16':
        return Math.round((baseWidth * 9) / 16);
      case '1:1':
        return baseWidth;
      default:
        return baseWidth;
    }
  }

  private getHeight(aspectRatio?: string, resolution?: string): number {
    const baseHeight = resolution === '1080p' ? 1080 : 720;
    switch (aspectRatio) {
      case '9:16':
        return Math.round((baseHeight * 16) / 9);
      case '1:1':
        return baseHeight;
      default:
        return baseHeight;
    }
  }

  private mapPredictionToJob(
    jobId: string,
    prediction: ReplicatePrediction,
    params: VideoGenerationParams
  ): VideoGenerationJob {
    const statusMap: Record<string, VideoJobStatus> = {
      starting: 'pending',
      processing: 'processing',
      succeeded: 'completed',
      failed: 'failed',
      canceled: 'cancelled',
    };

    const job: VideoGenerationJob = {
      id: jobId,
      status: statusMap[prediction.status] || 'pending',
      createdAt: new Date(prediction.created_at),
      startedAt: prediction.started_at ? new Date(prediction.started_at) : undefined,
      completedAt: prediction.completed_at ? new Date(prediction.completed_at) : undefined,
      params,
      providerJobId: prediction.id,
    };

    if (prediction.status === 'succeeded' && prediction.output) {
      const videoUrls = Array.isArray(prediction.output) ? prediction.output : [prediction.output];

      job.result = {
        success: true,
        videos: videoUrls.map((url, index) => this.createVideoFromUrl(url, index, prediction)),
        metadata: {
          provider: 'replicate',
          model: params.model || 'svd',
          generationTimeMs: prediction.metrics?.predict_time
            ? prediction.metrics.predict_time * 1000
            : 0,
          promptUsed: params.prompt,
          seed: params.seed,
          providerMetadata: {
            logs: prediction.logs,
          },
        },
      };
    }

    if (prediction.status === 'failed' && prediction.error) {
      job.error = {
        message: prediction.error,
        code: 'PROVIDER_ERROR',
        retryable: true,
      };
    }

    return job;
  }

  private createVideoFromUrl(
    url: string,
    index: number,
    prediction: ReplicatePrediction
  ): GeneratedVideo {
    return {
      id: `${prediction.id}-${index}`,
      url,
      duration: 4, // Would need to actually inspect the video
      width: 1024,
      height: 576,
      format: 'mp4',
      sizeBytes: 0, // Unknown until downloaded
      hasAudio: false,
    };
  }
}

export default ReplicateProvider;
