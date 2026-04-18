/**
 * Video Generation Module - Index
 *
 * Exports for the video generation integration in MCP Core.
 */

// Types
export * from './types';

// Provider interface and base class
export { BaseVideoProvider } from './providers/IVideoProvider';
export type { IVideoProvider } from './providers/IVideoProvider';

// Provider implementations
export { ReplicateProvider } from './providers/ReplicateProvider';
// export { VeoProvider } from './providers/VeoProvider';
// export { RunwayProvider } from './providers/RunwayProvider';
// export { PikaProvider } from './providers/PikaProvider';
// export { LumaProvider } from './providers/LumaProvider';

// MCP Tool
export {
  createVideoGenerationTool,
  VIDEO_GENERATION_INPUT_SCHEMA,
  VideoGenerationHandler,
} from './VideoGenerationTool';

// Factory function to create configured tool
import type { MCPTool } from '../../interfaces/IMCPTool';
import { VideoProviderConfig } from './types';
import { createVideoGenerationTool } from './VideoGenerationTool';

/**
 * Create a video generation tool from environment variables
 */
export function createVideoToolFromEnv(): MCPTool {
  const configs: VideoProviderConfig[] = [];

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
