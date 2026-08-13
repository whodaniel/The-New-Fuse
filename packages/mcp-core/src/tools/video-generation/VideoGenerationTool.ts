/**
 * Video Generation MCP Tool
 *
 * Provides video generation capabilities as an MCP tool that can be used
 * by AI agents and workflows in The New Fuse platform.
 */

import {
  JSONSchema,
  MCPTool,
  ToolHandler,
  ToolResult,
  ToolUsageStats,
  ValidationResult,
} from '../../interfaces/IMCPTool.js';
import { IVideoProvider } from './providers/IVideoProvider.js';
import { ReplicateProvider } from './providers/ReplicateProvider.js';
import {
  VideoGenerationJob,
  VideoGenerationParams,
  VideoProvider,
  VideoProviderConfig,
} from './types.js';

/**
 * Input schema for the video generation tool
 */
const VIDEO_GENERATION_INPUT_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    prompt: {
      type: 'string',
      description:
        'Detailed text description of the video to generate. Be specific about scene, action, style, and mood.',
    },
    provider: {
      type: 'string',
      enum: ['veo', 'runway', 'replicate', 'pika', 'luma'],
      description: 'Video generation provider to use',
      default: 'replicate',
    },
    model: {
      type: 'string',
      description:
        'Specific model to use (provider-dependent). Examples: svd, animatediff, zeroscope',
    },
    inputType: {
      type: 'string',
      enum: ['text', 'image', 'video'],
      description: 'Type of input for generation',
      default: 'text',
    },
    inputImageUrl: {
      type: 'string',
      description: 'URL of image to animate (required for image-to-video)',
    },
    duration: {
      type: 'number',
      description: 'Video duration in seconds (typically 4-16)',
      minimum: 2,
      maximum: 30,
      default: 4,
    },
    aspectRatio: {
      type: 'string',
      enum: ['16:9', '9:16', '1:1'],
      description: 'Video aspect ratio',
      default: '16:9',
    },
    resolution: {
      type: 'string',
      enum: ['720p', '1080p'],
      description: 'Output resolution',
      default: '720p',
    },
    style: {
      type: 'string',
      description: 'Style preset or description (e.g., "cinematic", "anime", "professional")',
    },
    negativePrompt: {
      type: 'string',
      description: 'Things to avoid in the video (e.g., "blurry, watermark, text")',
    },
    seed: {
      type: 'number',
      description: 'Random seed for reproducibility',
    },
    motionAmount: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'auto'],
      description: 'Amount of motion/movement in the video',
      default: 'auto',
    },
    waitForCompletion: {
      type: 'boolean',
      description:
        'If true, wait for video generation to complete before returning. If false, return job ID immediately.',
      default: true,
    },
  },
  required: ['prompt'],
};

/**
 * Output schema for video generation results
 */
const VIDEO_GENERATION_OUTPUT_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    jobId: { type: 'string' },
    videos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          url: { type: 'string' },
          thumbnailUrl: { type: 'string' },
          duration: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
        },
      },
    },
    metadata: {
      type: 'object',
    },
    error: { type: 'string' },
  },
};

/**
 * Handler for video generation tool
 */
class VideoGenerationHandler implements ToolHandler {
  private providers: Map<VideoProvider, IVideoProvider> = new Map();
  private usageStats: ToolUsageStats = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
  };
  private executionTimes: number[] = [];

  constructor(providerConfigs: VideoProviderConfig[]) {
    this.initializeProviders(providerConfigs);
  }

  private initializeProviders(configs: VideoProviderConfig[]): void {
    for (const config of configs) {
      if (!config.enabled || !config.apiKey) continue;

      switch (config.provider) {
        case 'replicate':
          this.providers.set(
            'replicate',
            new ReplicateProvider({
              apiKey: config.apiKey,
              baseUrl: config.baseUrl,
              timeoutMs: config.timeoutMs,
              maxRetries: config.maxRetries,
            })
          );
          break;

        // Add other providers here as they are implemented
        // case 'veo':
        //   this.providers.set('veo', new VeoProvider({ ... }));
        //   break;

        default:
          console.warn(`Unknown video provider: ${config.provider}`);
      }
    }

    if (this.providers.size === 0) {
      console.warn('No video providers configured. Video generation will not be available.');
    }
  }

  async validate(params: unknown): Promise<ValidationResult> {
    const p = params as Record<string, unknown>;
    const errors: string[] = [];

    // Validate prompt
    if (!p.prompt || typeof p.prompt !== 'string') {
      errors.push('prompt is required and must be a string');
    } else if (p.prompt.length < 10) {
      errors.push('prompt should be at least 10 characters for good results');
    } else if (p.prompt.length > 2000) {
      errors.push('prompt must be less than 2000 characters');
    }

    // Validate provider
    const provider = (p.provider as VideoProvider) || 'replicate';
    if (!this.providers.has(provider)) {
      const available = Array.from(this.providers.keys()).join(', ');
      errors.push(`Provider "${provider}" is not available. Available: ${available || 'none'}`);
    }

    // Validate image-to-video requirements
    if (p.inputType === 'image' && !p.inputImageUrl && !p.inputImageBase64) {
      errors.push('inputImageUrl is required for image-to-video generation');
    }

    // Validate duration
    if (p.duration !== undefined) {
      const duration = p.duration as number;
      if (duration < 2 || duration > 30) {
        errors.push('duration must be between 2 and 30 seconds');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      normalizedParams: {
        ...p,
        provider: provider,
        inputType: p.inputType || 'text',
        duration: p.duration || 4,
        aspectRatio: p.aspectRatio || '16:9',
        resolution: p.resolution || '720p',
        waitForCompletion: p.waitForCompletion !== false,
      },
    };
  }

  async execute(params: unknown): Promise<ToolResult> {
    const startTime = Date.now();
    this.usageStats.totalExecutions++;

    try {
      // Validate parameters
      const validation = await this.validate(params);
      if (!validation.valid) {
        this.usageStats.failedExecutions++;
        return {
          success: false,
          error: validation.errors?.join('; '),
        };
      }

      const normalizedParams = validation.normalizedParams as VideoGenerationParams & {
        waitForCompletion: boolean;
      };

      // Get provider
      const provider = this.providers.get(normalizedParams.provider);
      if (!provider) {
        throw new Error(`Provider ${normalizedParams.provider} is not available`);
      }

      // Start generation
      const job = await provider.generateVideo(normalizedParams);

      // Return immediately if not waiting
      if (!normalizedParams.waitForCompletion) {
        return {
          success: true,
          result: {
            jobId: job.id,
            status: job.status,
            message: 'Video generation started. Use the job ID to check status.',
          },
          metadata: {
            executionId: job.id,
            toolName: 'video-generation',
            executionTime: Date.now() - startTime,
          },
        };
      }

      // Wait for completion
      const result = await provider.waitForCompletion(job.id, {
        onProgress: (j: VideoGenerationJob) => {
          // Could emit progress events here
          console.log(`Video generation progress: ${j.progress}%`);
        },
      });

      const executionTime = Date.now() - startTime;
      this.recordExecution(executionTime, result.success);

      return {
        success: result.success,
        result: result,
        error: result.error,
        metadata: {
          executionId: job.id,
          toolName: 'video-generation',
          executionTime,
          context: {
            provider: normalizedParams.provider,
            model: result.metadata.model,
          },
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordExecution(executionTime, false);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video generation failed',
        metadata: {
          executionTime,
        },
      };
    }
  }

  async getUsageStats(): Promise<ToolUsageStats> {
    return { ...this.usageStats };
  }

  async cleanup(): Promise<void> {
    // Cancel any pending jobs, clean up resources
    this.providers.clear();
  }

  private recordExecution(timeMs: number, success: boolean): void {
    if (success) {
      this.usageStats.successfulExecutions++;
    } else {
      this.usageStats.failedExecutions++;
    }

    this.executionTimes.push(timeMs);
    if (this.executionTimes.length > 100) {
      this.executionTimes.shift();
    }

    this.usageStats.averageExecutionTime =
      this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length;
    this.usageStats.lastExecution = new Date();
  }

  /**
   * Get list of available providers and their capabilities
   */
  getAvailableProviders(): Array<{
    provider: VideoProvider;
    capabilities: ReturnType<IVideoProvider['getCapabilities']>;
  }> {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      provider: name,
      capabilities: provider.getCapabilities(),
    }));
  }

  /**
   * Get job status
   */
  async getJobStatus(provider: VideoProvider, jobId: string): Promise<VideoGenerationJob> {
    const p = this.providers.get(provider);
    if (!p) {
      throw new Error(`Provider ${provider} not available`);
    }
    return p.getJobStatus(jobId);
  }

  /**
   * Cancel a job
   */
  async cancelJob(provider: VideoProvider, jobId: string): Promise<void> {
    const p = this.providers.get(provider);
    if (!p) {
      throw new Error(`Provider ${provider} not available`);
    }
    return p.cancelJob(jobId);
  }
}

/**
 * Factory function to create the video generation tool
 */
export function createVideoGenerationTool(providerConfigs: VideoProviderConfig[]): MCPTool {
  const handler = new VideoGenerationHandler(providerConfigs);

  return {
    name: 'video-generation',
    description: `Generate AI videos using diffusion models. 
Supports text-to-video (describe what you want) and image-to-video (animate an image).
Available providers depend on configuration. Use for creating:
- Promotional videos
- Animated content
- Visual effects
- Creative video content

Always provide detailed, descriptive prompts for best results.`,
    inputSchema: VIDEO_GENERATION_INPUT_SCHEMA,
    outputSchema: VIDEO_GENERATION_OUTPUT_SCHEMA,
    handler,
    config: {
      timeout: 600000, // 10 minutes - video generation can take time
      maxMemory: 1024 * 1024 * 100, // 100MB
      sandboxed: false,
      resourceLimits: {
        networkOperations: 10,
      },
    },
    permissions: {
      execute: true,
      rateLimit: {
        maxRequests: 10,
        windowSeconds: 3600, // 10 per hour per user
        burstSize: 3,
      },
    },
  };
}

/**
 * Default export for convenience
 */
export { VIDEO_GENERATION_INPUT_SCHEMA, VideoGenerationHandler };
