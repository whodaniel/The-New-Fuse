import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMRegistry } from '@/llm/LLMRegistry';
/**
 * FuseMonitoringService
 *
 * This service provides comprehensive tracing, observability, and evaluation
 * of LLM operations within The New Fuse platform.
 *
 * It can be used to trace various aspects of LLM usage including:
 * - Completions and chat completions
 * - Prompt execution and rendering
 * - Tool use and function calls
 * - Evaluation of generation quality
 *
 * The service offers native monitoring capabilities with optional
 * integration with external services like Langfuse.
 */
export declare class FuseMonitoringService implements OnModuleInit {
    private readonly configService;
    private readonly llmRegistry;
    private readonly logger;
    private langfuse;
    private langfuseEnabled;
    private monitoringEnabled;
    private localTraceStore;
    private localGenerationStore;
    private localScoreStore;
    constructor(configService: ConfigService, llmRegistry: LLMRegistry);
    onModuleInit(): Promise<void>;
    /**
     * Create a new trace for tracking a high-level user session or operation
     */
    createTrace(options: {
        name?: string;
        userId?: string;
        metadata?: Record<string, any>;
        tags?: string[];
    }): {
        id: string;
        name: string;
        langfuseTrace: any;
    };
    /**
     * Create a new generation to track an LLM call
     */
    createGeneration(options: {
        traceId?: string;
        name?: string;
        model: string;
        modelParameters?: Record<string, any>;
        prompt: string | any[];
        completion?: string;
        usage?: {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
        };
        metadata?: Record<string, any>;
        startTime?: Date;
        endTime?: Date;
    }): {
        id: string;
        name: string;
        langfuseGeneration: any;
    };
    /**
     * Score a generation or the results of an operation
     */
    scoreGeneration(options: {
        traceId?: string;
        generationId?: string;
        name: string;
        value: number;
        comment?: string;
    }): {
        id: string;
        name: string;
        langfuseScore: any;
    };
    /**
     * Wrap an OpenAI API call with tracing
     */
    traceOpenAI<T>(options: {
        traceId?: string;
        name?: string;
        metadata?: Record<string, any>;
    }, apiCall: () => Promise<T>): Promise<T>;
    /**
     * Trace any LLM call from any provider using the provider ID
     */
    traceLLMCall<T>(options: {
        llmProviderId: string;
        traceId?: string;
        name?: string;
        prompt: string | any[];
        metadata?: Record<string, any>;
    }, apiCall: () => Promise<T>): Promise<T>;
    /**
     * Trace a VS Code Copilot LLM call
     */
    traceVSCodeCopilot<T>(options: {
        traceId?: string;
        name?: string;
        prompt: string | any[];
        metadata?: Record<string, any>;
    }, apiCall: () => Promise<T>): Promise<T>;
    /**
     * Log an error event
     */
    private logError;
    /**
     * Get a trace by ID
     */
    getTrace(traceId: string): any;
    /**
     * Get a generation by ID
     */
    getGeneration(generationId: string): any;
    /**
     * Get all traces for a user
     */
    getTracesForUser(userId: string): any[];
    /**
     * Get recent traces
     */
    getRecentTraces(limit?: number): any[];
    /**
     * Get summary metrics
     */
    getMetrics(): {
        traceCount: number;
        generationCount: number;
        totalTokens: any;
        modelUsage: any;
        averageLatency: number;
    };
    /**
     * Clean up old traces to prevent memory issues
     */
    private cleanupOldTraces;
    /**
     * Clean up old generations to prevent memory issues
     */
    private cleanupOldGenerations;
    /**
     * Check if Langfuse integration is enabled
     */
    isLangfuseEnabled(): boolean;
    /**
     * Enable or disable Langfuse integration
     */
    setLangfuseEnabled(enabled: boolean): void;
    /**
     * Enable or disable native monitoring
     */
    setMonitoringEnabled(enabled: boolean): void;
}
//# sourceMappingURL=LangfuseService.d.ts.map