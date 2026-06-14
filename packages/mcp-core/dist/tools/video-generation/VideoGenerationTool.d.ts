/**
 * Video Generation MCP Tool
 *
 * Provides video generation capabilities as an MCP tool that can be used
 * by AI agents and workflows in The New Fuse platform.
 */
import { JSONSchema, MCPTool, ToolHandler, ToolResult, ToolUsageStats, ValidationResult } from '../../interfaces/IMCPTool.js';
import { IVideoProvider } from './providers/IVideoProvider.js';
import { VideoGenerationJob, VideoProvider, VideoProviderConfig } from './types.js';
/**
 * Input schema for the video generation tool
 */
declare const VIDEO_GENERATION_INPUT_SCHEMA: JSONSchema;
/**
 * Handler for video generation tool
 */
declare class VideoGenerationHandler implements ToolHandler {
    private providers;
    private usageStats;
    private executionTimes;
    constructor(providerConfigs: VideoProviderConfig[]);
    private initializeProviders;
    validate(params: unknown): Promise<ValidationResult>;
    execute(params: unknown): Promise<ToolResult>;
    getUsageStats(): Promise<ToolUsageStats>;
    cleanup(): Promise<void>;
    private recordExecution;
    /**
     * Get list of available providers and their capabilities
     */
    getAvailableProviders(): Array<{
        provider: VideoProvider;
        capabilities: ReturnType<IVideoProvider['getCapabilities']>;
    }>;
    /**
     * Get job status
     */
    getJobStatus(provider: VideoProvider, jobId: string): Promise<VideoGenerationJob>;
    /**
     * Cancel a job
     */
    cancelJob(provider: VideoProvider, jobId: string): Promise<void>;
}
/**
 * Factory function to create the video generation tool
 */
export declare function createVideoGenerationTool(providerConfigs: VideoProviderConfig[]): MCPTool;
/**
 * Default export for convenience
 */
export { VIDEO_GENERATION_INPUT_SCHEMA, VideoGenerationHandler };
//# sourceMappingURL=VideoGenerationTool.d.ts.map