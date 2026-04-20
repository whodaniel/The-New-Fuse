/**
 * Video Provider Interface
 *
 * Abstract interface for video diffusion model providers.
 * Implement this interface to add support for new video generation services.
 */

import {
  CostEstimate,
  VideoGenerationJob,
  VideoGenerationParams,
  VideoGenerationResult,
  VideoProvider,
  VideoProviderCapabilities,
} from '../types.js';

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
  waitForCompletion(
    jobId: string,
    options?: {
      pollIntervalMs?: number;
      maxWaitMs?: number;
      onProgress?: (job: VideoGenerationJob) => void;
    }
  ): Promise<VideoGenerationResult>;

  /**
   * Download a generated video to a local path
   */
  downloadVideo(videoUrl: string, outputPath: string): Promise<string>;
}

/**
 * Base class for video providers with common functionality
 */
export abstract class BaseVideoProvider implements IVideoProvider {
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
  }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || this.getDefaultBaseUrl();
    this.timeoutMs = config.timeoutMs || 300000; // 5 minutes default
    this.maxRetries = config.maxRetries || 3;
  }

  protected abstract getDefaultBaseUrl(): string;

  abstract getCapabilities(): VideoProviderCapabilities;
  abstract validateCredentials(): Promise<boolean>;
  abstract estimateCost(params: VideoGenerationParams): Promise<CostEstimate>;
  abstract generateVideo(params: VideoGenerationParams): Promise<VideoGenerationJob>;
  abstract getJobStatus(jobId: string): Promise<VideoGenerationJob>;
  abstract cancelJob(jobId: string): Promise<void>;

  async isAvailable(): Promise<boolean> {
    try {
      return await this.validateCredentials();
    } catch {
      return false;
    }
  }

  async downloadVideo(videoUrl: string, outputPath: string): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');

    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, Buffer.from(buffer));
    return outputPath;
  }

  /**
   * Helper method for making authenticated API requests
   */
  protected async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    this.setAuthHeader(headers);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorBody}`
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Set authentication header (override in subclasses for different auth methods)
   */
  protected setAuthHeader(headers: Headers): void {
    headers.set('Authorization', `Bearer ${this.apiKey}`);
  }

  /**
   * Generate a unique job ID
   */
  protected generateJobId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Poll for job completion
   */
  async waitForCompletion(
    jobId: string,
    options: {
      pollIntervalMs?: number;
      maxWaitMs?: number;
      onProgress?: (job: VideoGenerationJob) => void;
    } = {}
  ): Promise<VideoGenerationResult> {
    const {
      pollIntervalMs = 5000,
      maxWaitMs = 600000, // 10 minutes
      onProgress,
    } = options;

    const startTime = Date.now();

    while (true) {
      const job = await this.getJobStatus(jobId);

      if (onProgress) {
        onProgress(job);
      }

      if (job.status === 'completed' && job.result) {
        return job.result;
      }

      if (job.status === 'failed') {
        throw new Error(job.error?.message || 'Video generation failed');
      }

      if (job.status === 'cancelled') {
        throw new Error('Video generation was cancelled');
      }

      if (Date.now() - startTime > maxWaitMs) {
        throw new Error('Video generation timed out');
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }
}
