"use strict";
/**
 * Base Adapter for Media Generation Providers
 *
 * Abstract base class for all provider adapters
 *
 * @module BaseAdapter
 * @since 2025-10-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAdapter = void 0;
class BaseAdapter {
    provider;
    apiKey;
    constructor(provider) {
        this.provider = provider;
        this.apiKey = this.getApiKey();
    }
    /**
     * Get API key from environment
     */
    getApiKey() {
        const keyMappings = {
            'recraft-v3': 'RECRAFT_API_KEY',
            'flux-1-1-pro': 'REPLICATE_API_TOKEN',
            'dall-e-3': 'OPENAI_API_KEY',
            'stable-diffusion-3-5': 'STABILITY_API_KEY',
            'ideogram-2-0': 'IDEOGRAM_API_KEY',
            'sora-2-0': 'OPENAI_API_KEY',
            'runway-gen3-alpha': 'RUNWAY_API_KEY',
            'kling-ai': 'KLING_API_KEY',
            'luma-dream-machine': 'LUMA_API_KEY',
            'pika-2-2': 'PIKA_API_KEY',
            'haiper-ai': 'HAIPER_API_KEY',
            'suno-v4': 'SUNO_API_KEY',
            'udio-v2': 'UDIO_API_KEY',
            'elevenlabs-v3': 'ELEVENLABS_API_KEY',
            'openai-tts-hd': 'OPENAI_API_KEY',
            'murf-ai': 'MURF_API_KEY'
        };
        const envVar = keyMappings[this.provider.id];
        return envVar ? process.env[envVar] : undefined;
    }
    /**
     * Make HTTP request with error handling
     */
    async makeRequest(url, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': 'TheNewFuse/1.0.0',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey} })
    };

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();`,
                throw: new Error(`HTTP ${response.status}`, $, { errorText })
            }),
            return: response
        };
        try { }
        catch (error) {
            if (error instanceof Error) {
                `
        throw new Error(`;
                Request;
                failed: $;
                {
                    error.message;
                }
                `);
      }
      throw error;
    }
  }

  /**
   * Calculate cost based on provider pricing
   */
  protected calculateCost(
    request: MediaGenerationRequest,
    outputs: MediaOutput[]
  ): number {
    const model = this.provider.models.find(m => m.id === request.model) || this.provider.models[0];
    if (!model) return 0;

    const pricing = model.pricing;
    
    switch (pricing.model) {
      case 'per_generation':
        return pricing.cost * outputs.length;
      
      case 'per_second':
        const totalDuration = outputs.reduce((sum, output) => sum + (output.duration || 0), 0);
        return pricing.cost * totalDuration;
      
      case 'per_character':
        return pricing.cost * request.prompt.length;
      
      case 'subscription':
        return 0; // Subscription costs are handled separately
      
      default:
        return 0;
    }
  }

  /**
   * Validate request parameters
   */
  protected validateRequest(request: MediaGenerationRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    if (!request.mediaType) {
      throw new Error('Media type is required');
    }

    if (!this.provider.mediaTypes.includes(request.mediaType as any)) {
      throw new Error(Provider ${this.provider.id} does not support ${request.mediaType});
    }

    // Validate parameters based on media type
    if (request.mediaType === 'image' && request.parameters) {
      const { width, height } = request.parameters;
      if (width && (width < 64 || width > 4096)) {
        throw new Error('Image width must be between 64 and 4096 pixels');
      }
      if (height && (height < 64 || height > 4096)) {
        throw new Error('Image height must be between 64 and 4096 pixels');
      }
    }

    if (request.mediaType === 'video' && request.parameters) {
      const { duration } = request.parameters;
      if (duration && (duration < 1 || duration > 300)) {
        throw new Error('Video duration must be between 1 and 300 seconds');
      }
    }
  }

  /**
   * Generate unique filename
   */
  protected generateFilename(mediaType: string, format: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);`;
                return $;
                {
                    mediaType;
                }
                `_${timestamp}_${random}.${format.toLowerCase()};
  }

  /**
   * Get MIME type from format
   */
  protected getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      'ogg': 'audio/ogg'
    };

    return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Wait for async operation with timeout
   */
  protected async waitForCompletion(
    checkFn: () => Promise<boolean>,
    timeout: number = 120000,
    interval: number = 2000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await checkFn()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Operation timed out');
  }

  /**
   * Retry operation with exponential backoff
   */
  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
`;
                /**`
                 * Log operation for debugging
                 */
            }
            /**`
             * Log operation for debugging
             */
        }
        /**`
         * Log operation for debugging
         */
    }
    /**`
     * Log operation for debugging
     */
    log(level, message, data) {
        `
    const timestamp = new Date().toISOString();
    const logMessage = [${timestamp}`;
        [$, { this: .provider.id }];
        $;
        {
            message;
        }
        `;
    
    switch (level) {
      case 'info':
        console.log(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
    }
  }
}
        ;
    }
}
exports.BaseAdapter = BaseAdapter;
//# sourceMappingURL=BaseAdapter.js.map