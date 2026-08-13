/**
 * Video Generation Types for MCP Video Diffusion Integration
 *
 * This module defines the core types for integrating video diffusion models
 * into The New Fuse platform.
 */

// ============================================================
// VIDEO GENERATION PARAMETERS
// ============================================================

export type VideoProvider = 'veo' | 'runway' | 'sora' | 'pika' | 'luma' | 'replicate' | 'stability';

export type VideoInputType = 'text' | 'image' | 'video';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';

export type VideoResolution = '480p' | '720p' | '1080p' | '4k';

export type VideoFormat = 'mp4' | 'webm' | 'mov' | 'gif';

export interface VideoGenerationParams {
  /** Detailed text prompt describing the video to generate */
  prompt: string;

  /** Video generation provider to use */
  provider: VideoProvider;

  /** Specific model to use (provider-specific) */
  model?: string;

  // ----- Input Options -----

  /** Type of input for generation */
  inputType: VideoInputType;

  /** URL of image to animate (for image-to-video) */
  inputImageUrl?: string;

  /** Base64 encoded image data (alternative to URL) */
  inputImageBase64?: string;

  /** URL of video for video-to-video transformations */
  inputVideoUrl?: string;

  // ----- Output Options -----

  /** Target video duration in seconds (typically 4-16, provider-dependent) */
  duration?: number;

  /** Video aspect ratio */
  aspectRatio?: AspectRatio;

  /** Output resolution */
  resolution?: VideoResolution;

  /** Frames per second */
  fps?: 24 | 30 | 60;

  /** Output format */
  format?: VideoFormat;

  // ----- Style & Control Options -----

  /** Style preset or description */
  style?: string;

  /** What to avoid in the video */
  negativePrompt?: string;

  /** Random seed for reproducibility */
  seed?: number;

  /** Number of videos to generate */
  numVideos?: number;

  /** How closely to follow the prompt (1-20, higher = stricter) */
  guidanceScale?: number;

  /** Motion intensity (provider-specific) */
  motionAmount?: 'low' | 'medium' | 'high' | 'auto';

  // ----- Camera Motion (advanced) -----

  /** Camera movement type */
  cameraMotion?: CameraMotionParams;

  // ----- Metadata -----

  /** User ID for tracking/billing */
  userId?: string;

  /** Request correlation ID */
  correlationId?: string;

  /** Additional provider-specific options */
  providerOptions?: Record<string, unknown>;
}

export interface CameraMotionParams {
  type: 'static' | 'pan' | 'tilt' | 'zoom' | 'orbit' | 'dolly' | 'auto';
  direction?: 'left' | 'right' | 'up' | 'down' | 'in' | 'out';
  speed?: 'slow' | 'medium' | 'fast';
}

// ============================================================
// VIDEO GENERATION RESULTS
// ============================================================

export interface GeneratedVideo {
  /** Unique video identifier */
  id: string;

  /** URL to access the video */
  url: string;

  /** URL of video thumbnail/poster image */
  thumbnailUrl?: string;

  /** Video duration in seconds */
  duration: number;

  /** Video width in pixels */
  width: number;

  /** Video height in pixels */
  height: number;

  /** Video format (mp4, webm, etc.) */
  format: VideoFormat;

  /** File size in bytes */
  sizeBytes: number;

  /** Frames per second */
  fps?: number;

  /** When the video URL expires (if applicable) */
  expiresAt?: Date;

  /** Has audio track */
  hasAudio: boolean;
}

export interface VideoGenerationResult {
  /** Whether generation was successful */
  success: boolean;

  /** Generated videos (may be multiple if numVideos > 1) */
  videos: GeneratedVideo[];

  /** Generation metadata */
  metadata: VideoGenerationMetadata;

  /** Error message if success is false */
  error?: string;

  /** Detailed error code */
  errorCode?: VideoGenerationErrorCode;
}

export interface VideoGenerationMetadata {
  /** Provider used */
  provider: VideoProvider;

  /** Model used */
  model: string;

  /** Total generation time in milliseconds */
  generationTimeMs: number;

  /** Time spent in queue */
  queueTimeMs?: number;

  /** Time spent actually generating */
  processingTimeMs?: number;

  /** Cost information */
  cost?: VideoGenerationCost;

  /** The actual prompt used (may differ from input if modified) */
  promptUsed: string;

  /** Seed used for generation */
  seed?: number;

  /** Provider-specific metadata */
  providerMetadata?: Record<string, unknown>;
}

export interface VideoGenerationCost {
  /** Credits consumed (provider-specific) */
  credits?: number;

  /** Tokens consumed (for token-based pricing) */
  tokens?: number;

  /** Estimated USD cost */
  usd?: number;

  /** Billing unit description */
  unit?: string;
}

// ============================================================
// JOB MANAGEMENT
// ============================================================

export type VideoJobStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface VideoGenerationJob {
  /** Unique job identifier */
  id: string;

  /** Current job status */
  status: VideoJobStatus;

  /** Progress percentage (0-100) */
  progress?: number;

  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;

  /** Current processing stage */
  stage?: string;

  /** When the job was created */
  createdAt: Date;

  /** When the job started processing */
  startedAt?: Date;

  /** When the job completed or failed */
  completedAt?: Date;

  /** Generation result (present when completed) */
  result?: VideoGenerationResult;

  /** Error information (present when failed) */
  error?: VideoJobError;

  /** Original generation parameters */
  params: VideoGenerationParams;

  /** Provider-specific job ID */
  providerJobId?: string;
}

export interface VideoJobError {
  message: string;
  code: VideoGenerationErrorCode;
  details?: string;
  retryable: boolean;
}

export type VideoGenerationErrorCode =
  | 'INVALID_PARAMS'
  | 'CONTENT_POLICY_VIOLATION'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'PROVIDER_ERROR'
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'INTERNAL_ERROR'
  | 'INVALID_API_KEY'
  | 'INSUFFICIENT_CREDITS'
  | 'MODEL_NOT_AVAILABLE'
  | 'UNSUPPORTED_INPUT_TYPE';

// ============================================================
// PROVIDER CAPABILITIES
// ============================================================

export interface VideoProviderCapabilities {
  /** Supported input types */
  inputTypes: VideoInputType[];

  /** Available models */
  models: VideoModelInfo[];

  /** Supported aspect ratios */
  aspectRatios: AspectRatio[];

  /** Supported resolutions */
  resolutions: VideoResolution[];

  /** Duration limits in seconds */
  durationLimits: {
    min: number;
    max: number;
    default: number;
  };

  /** Whether audio generation is supported */
  supportsAudio: boolean;

  /** Whether camera motion controls are supported */
  supportsCameraMotion: boolean;

  /** Whether style presets are supported */
  supportsStyles: boolean;

  /** Maximum videos per request */
  maxVideosPerRequest: number;

  /** Rate limits */
  rateLimits?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
}

export interface VideoModelInfo {
  /** Model identifier */
  id: string;

  /** Display name */
  name: string;

  /** Model description */
  description?: string;

  /** Whether this is the default model */
  isDefault?: boolean;

  /** Quality tier */
  quality?: 'standard' | 'high' | 'premium';

  /** Speed tier */
  speed?: 'fast' | 'standard' | 'slow';

  /** Supported input types for this model */
  inputTypes?: VideoInputType[];
}

// ============================================================
// COST ESTIMATION
// ============================================================

export interface CostEstimate {
  /** Estimated credits */
  credits?: number;

  /** Estimated tokens */
  tokens?: number;

  /** Estimated USD cost */
  usd: number;

  /** Whether this is an exact quote or estimate */
  isExact: boolean;

  /** Breakdown by component */
  breakdown?: CostBreakdownItem[];
}

export interface CostBreakdownItem {
  component: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

// ============================================================
// PROVIDER CONFIGURATION
// ============================================================

export interface VideoProviderConfig {
  /** Provider name */
  provider: VideoProvider;

  /** API key or authentication token */
  apiKey?: string;

  /** API base URL (for self-hosted or custom endpoints) */
  baseUrl?: string;

  /** Request timeout in milliseconds */
  timeoutMs?: number;

  /** Maximum retries on transient failures */
  maxRetries?: number;

  /** Whether this provider is enabled */
  enabled: boolean;

  /** Priority for provider selection (lower = higher priority) */
  priority?: number;

  /** Cost weight for selection (lower = prefer) */
  costWeight?: number;

  /** Quality weight for selection (higher = prefer) */
  qualityWeight?: number;

  /** Provider-specific configuration */
  providerConfig?: Record<string, unknown>;
}

// ============================================================
// EVENTS
// ============================================================

export type VideoGenerationEventType =
  | 'job.created'
  | 'job.started'
  | 'job.progress'
  | 'job.completed'
  | 'job.failed'
  | 'job.cancelled';

export interface VideoGenerationEvent {
  type: VideoGenerationEventType;
  jobId: string;
  timestamp: Date;
  data: VideoGenerationJob;
}
