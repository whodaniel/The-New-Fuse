"use strict";
/**
 * Generative Media Provider Registry
 *
 * Unified registry for image, video, and audio generation models
 * Extends the LLM provider pattern for multimodal AI
 *
 * @module GenerativeMediaProviderRegistry
 * @since 2025-10-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerativeMediaProviderRegistry = exports.MediaProviderType = exports.MediaType = void 0;
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "image";
    MediaType["VIDEO"] = "video";
    MediaType["AUDIO"] = "audio";
    MediaType["MUSIC"] = "music";
    MediaType["VOICE"] = "voice";
})(MediaType || (exports.MediaType = MediaType = {}));
var MediaProviderType;
(function (MediaProviderType) {
    MediaProviderType["API_DIRECT"] = "api_direct";
    MediaProviderType["REPLICATE"] = "replicate";
    MediaProviderType["HUGGING_FACE"] = "hugging_face";
    MediaProviderType["SELF_HOSTED"] = "self_hosted";
    MediaProviderType["DISCORD_BOT"] = "discord_bot";
})(MediaProviderType || (exports.MediaProviderType = MediaProviderType = {}));
class GenerativeMediaProviderRegistry {
    providers = new Map();
    logger = console; // Replace with proper logger
    constructor() {
        this.initializeDefaultProviders();
    }
    /**
     * Register a new media provider
     */
    async registerProvider(config) {
        this.providers.set(config.id, config);
        await this.checkProviderHealth(config.id);
        this.logger.info(`Registered media provider: ${config.name});
  }

  /**
   * Get all providers or filter by media type
   */
  getProviders(mediaType?: MediaType): MediaProviderConfig[] {
    const allProviders = Array.from(this.providers.values());
    
    if (mediaType) {
      return allProviders.filter(p => p.mediaTypes.includes(mediaType));
    }
    
    return allProviders;
  }

  /**
   * Generate media with automatic provider selection
   */
  async generateMedia(request: MediaGenerationRequest): Promise<MediaGenerationResult> {
    const providers = this.getProviders(request.mediaType)
      .filter(p => p.status === 'available')
      .sort((a, b) => b.priority - a.priority);

    if (providers.length === 0) {`);
        throw new Error(`No available providers for ${request.mediaType}`);
    }
    providerId = request.providerId || providers[0].id;
}
exports.GenerativeMediaProviderRegistry = GenerativeMediaProviderRegistry;
return this.generateWithProvider(providerId, request);
/**
 * Generate media with specific provider
 */
async;
generateWithProvider(providerId, string, request, MediaGenerationRequest);
Promise < MediaGenerationResult > {
    const: provider = this.providers.get(providerId),
    if(, provider) {
        throw new Error(Provider, $, { providerId }, not, found);
    },
    const: startTime = Date.now(),
    try: {
        const: result = await this.executeGeneration(provider, request),
        return: {
            success: true,
            mediaType: request.mediaType,
            providerId,
            model: request.model || provider.models[0]?.id || 'default',
            outputs: result.outputs,
            metadata: {
                generationTime: Date.now() - startTime,
                cost: result.cost,
                parameters: request.parameters || {}
            }
        }
    }, catch(error) {
        return {
            success: false,
            mediaType: request.mediaType,
            providerId,
            model: request.model || 'unknown',
            outputs: [],
            metadata: {
                generationTime: Date.now() - startTime,
                parameters: request.parameters || {},
                error: error.message
            }
        };
    }
};
async;
executeGeneration(provider, MediaProviderConfig, request, MediaGenerationRequest);
Promise < { outputs: MediaOutput[], cost: number } > {
    switch(provider) { }, : .type
};
{
    MediaProviderType.API_DIRECT;
    return this.executeDirectAPI(provider, request);
    MediaProviderType.REPLICATE;
    return this.executeReplicate(provider, request);
    MediaProviderType.HUGGING_FACE;
    return this.executeHuggingFace(provider, request);
    `
        throw new Error(Provider type ${provider.type}`;
    not;
    implemented;
    ;
}
async;
executeDirectAPI(provider, MediaProviderConfig, request, MediaGenerationRequest);
Promise < { outputs: MediaOutput[], cost: number } > {
    const: { DirectAPIAdapter } = await import('./adapters/DirectAPIAdapter'),
    const: adapter = new DirectAPIAdapter(provider),
    return: adapter.execute(request)
};
async;
executeReplicate(provider, MediaProviderConfig, request, MediaGenerationRequest);
Promise < { outputs: MediaOutput[], cost: number } > {
    const: { ReplicateAdapter } = await import('./adapters/ReplicateAdapter'),
    const: adapter = new ReplicateAdapter(provider),
    return: adapter.execute(request)
};
async;
executeHuggingFace(provider, MediaProviderConfig, request, MediaGenerationRequest);
Promise < { outputs: MediaOutput[], cost: number } > {
    const: { HuggingFaceAdapter } = await import('./adapters/HuggingFaceAdapter'),
    const: adapter = new HuggingFaceAdapter(provider),
    return: adapter.execute(request)
};
async;
checkProviderHealth(providerId, string);
Promise < void  > {
    const: provider = this.providers.get(providerId),
    if(, provider) { }, return: ,
    try: {
        // Implement health check logic
        provider, : .status = 'available'
    }, catch(error) {
        provider.status = 'unavailable';
        this.logger.error(Provider, $, { providerId }, health, check, failed, error);
    }
};
async;
initializeDefaultProviders();
Promise < void  > {
    const: { IMAGE_PROVIDERS } = await import('./providers/ImageProviders'),
    const: { VIDEO_PROVIDERS } = await import('./providers/VideoProviders'),
    const: { AUDIO_PROVIDERS } = await import('./providers/AudioProviders'),
    // Register all image providers
    for(, provider, of, IMAGE_PROVIDERS) {
        await this.registerProvider(provider);
    }
    // Register all video providers
    ,
    // Register all video providers
    for(, provider, of, VIDEO_PROVIDERS) {
        await this.registerProvider(provider);
    }
    // Register all audio providers
    ,
    // Register all audio providers
    for(, provider, of, AUDIO_PROVIDERS) {
        await this.registerProvider(provider);
        `
    }`;
        this.logger.info(Initialized, $, { this: .providers.size } ` generative media providers`);
    }
};
//# sourceMappingURL=GenerativeMediaProviderRegistry.js.map