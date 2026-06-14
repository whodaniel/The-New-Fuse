/**
 * Video Generation Module - Index
 *
 * Exports for the video generation integration in MCP Core.
 */
export * from './types.js';
export { BaseVideoProvider } from './providers/IVideoProvider.js';
export type { IVideoProvider } from './providers/IVideoProvider.js';
export { ReplicateProvider } from './providers/ReplicateProvider.js';
export { createVideoGenerationTool, VIDEO_GENERATION_INPUT_SCHEMA, VideoGenerationHandler, } from './VideoGenerationTool.js';
import type { MCPTool } from '../../interfaces/IMCPTool.js';
/**
 * Create a video generation tool from environment variables
 */
export declare function createVideoToolFromEnv(): MCPTool;
//# sourceMappingURL=index.d.ts.map