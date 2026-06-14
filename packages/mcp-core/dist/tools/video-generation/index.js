/**
 * Video Generation Module - Index
 *
 * Exports for the video generation integration in MCP Core.
 */
// Types
export * from './types.js';
// Provider interface and base class
export { BaseVideoProvider } from './providers/IVideoProvider.js';
// Provider implementations
export { ReplicateProvider } from './providers/ReplicateProvider.js';
// export { VeoProvider } from './providers/VeoProvider.js';
// export { RunwayProvider } from './providers/RunwayProvider.js';
// export { PikaProvider } from './providers/PikaProvider.js';
// export { LumaProvider } from './providers/LumaProvider.js';
// MCP Tool
export { createVideoGenerationTool, VIDEO_GENERATION_INPUT_SCHEMA, VideoGenerationHandler, } from './VideoGenerationTool.js';
import { createVideoGenerationTool } from './VideoGenerationTool.js';
/**
 * Create a video generation tool from environment variables
 */
export function createVideoToolFromEnv() {
    const configs = [];
    // Replicate
    if (process.env.REPLICATE_API_TOKEN) {
        configs.push({
            provider: 'replicate',
            apiKey: process.env.REPLICATE_API_TOKEN,
            enabled: true,
            priority: 1,
        });
    }
    // Google Veo (via Gemini API)
    if (process.env.VEO_API_KEY || process.env.GOOGLE_AI_API_KEY) {
        configs.push({
            provider: 'veo',
            apiKey: process.env.VEO_API_KEY || process.env.GOOGLE_AI_API_KEY || '',
            enabled: true,
            priority: 2,
        });
    }
    // Runway
    if (process.env.RUNWAY_API_KEY) {
        configs.push({
            provider: 'runway',
            apiKey: process.env.RUNWAY_API_KEY,
            enabled: true,
            priority: 3,
        });
    }
    // Pika
    if (process.env.PIKA_API_KEY) {
        configs.push({
            provider: 'pika',
            apiKey: process.env.PIKA_API_KEY,
            enabled: true,
            priority: 4,
        });
    }
    // Luma
    if (process.env.LUMA_API_KEY) {
        configs.push({
            provider: 'luma',
            apiKey: process.env.LUMA_API_KEY,
            enabled: true,
            priority: 5,
        });
    }
    return createVideoGenerationTool(configs);
}
//# sourceMappingURL=index.js.map