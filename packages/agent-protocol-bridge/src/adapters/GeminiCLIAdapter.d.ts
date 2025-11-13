/**
 * Gemini CLI Adapter
 *
 * Protocol adapter for translating between A2A messages and Gemini CLI commands.
 * Enables seamless integration of Gemini AI capabilities into the agent ecosystem.
 *
 * @module GeminiCLIAdapter
 * @since 2025-10-05
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GeminiCLIService } from '@the-new-fuse/core/services/GeminiCLIService';
import { ProtocolType } from '../types/prisma-enums';
export declare enum A2AMessageType {
    TASK_ASSIGNMENT = "TASK_ASSIGNMENT",
    CODE_ANALYSIS = "CODE_ANALYSIS",
    CODE_GENERATION = "CODE_GENERATION",
    DEBUG_REQUEST = "DEBUG_REQUEST",
    REFACTOR_REQUEST = "REFACTOR_REQUEST",
    MULTIMODAL_ANALYSIS = "MULTIMODAL_ANALYSIS",
    WEB_RESEARCH = "WEB_RESEARCH",
    STATUS_UPDATE = "STATUS_UPDATE",
    TASK_COMPLETION = "TASK_COMPLETION",
    ERROR_REPORT = "ERROR_REPORT"
}
export interface A2AMessage {
    id: string;
    type: A2AMessageType;
    payload: any;
    metadata?: {
        sender?: string;
        timestamp?: Date;
        priority?: 'low' | 'normal' | 'high' | 'urgent';
        correlationId?: string;
    };
}
export interface GeminiTaskRequest {
    prompt: string;
    model?: string;
    temperature?: number;
    taskType: 'query' | 'code_analysis' | 'code_generation' | 'debug' | 'refactor' | 'multimodal' | 'web_search';
    context?: any;
}
export interface GeminiAdapterConfig {
    defaultModel?: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-exp-1206';
    defaultTemperature?: number;
    enableWebSearch?: boolean;
    enableCodeExecution?: boolean;
}
export declare class GeminiCLIAdapter {
    private readonly geminiService;
    private readonly eventEmitter;
    private readonly logger;
    private config;
    constructor(geminiService: GeminiCLIService, eventEmitter: EventEmitter2, config?: GeminiAdapterConfig);
    /**
     * Get supported protocol
     */
    getSupportedProtocol(): ProtocolType;
    /**
     * Translate A2A message to Gemini task
     */
    translateToGemini(message: A2AMessage): Promise<GeminiTaskRequest>;
}
//# sourceMappingURL=GeminiCLIAdapter.d.ts.map