/**
 * Auggie CLI Adapter
 *
 * Protocol adapter for translating between A2A messages and Auggie CLI commands.
 * Enables seamless integration of Augment Code's AI capabilities into the agent ecosystem.
 *
 * @module AuggieCLIAdapter
 * @since 2025-10-06
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProtocolType } from '../types/prisma-enums';
import { A2AMessage } from '@the-new-fuse/a2a-core';
export interface AuggieQueryOptions {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    files?: string[];
    codebaseContext?: boolean;
    interactive?: boolean;
    workspace?: string;
}
export interface AuggieCodeAnalysisOptions {
    filePath: string;
    analysisType: 'review' | 'optimize' | 'explain' | 'security' | 'test' | 'refactor';
    context?: string;
    includeCodebase?: boolean;
}
export interface AuggieTaskOptions {
    task: string;
    workspace?: string;
    files?: string[];
    interactive?: boolean;
    dryRun?: boolean;
}
export interface AuggieResponse {
    content: string;
    model: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
    timestamp: Date;
    sessionId?: string;
}
export interface AuggieTaskRequest {
    prompt: string;
    model?: string;
    temperature?: number;
    taskType: 'query' | 'code_analysis' | 'code_generation' | 'debug' | 'refactor' | 'documentation' | 'test_generation' | 'task_execution';
    context?: any;
}
export interface AuggieAdapterConfig {
    defaultModel?: 'claude-sonnet-4' | 'claude-haiku-3' | 'claude-opus-3';
    defaultTemperature?: number;
    enableCodebaseContext?: boolean;
    defaultWorkspace?: string;
}
export declare class AuggieCLIAdapter {
    private readonly eventEmitter;
    private readonly logger;
    private config;
    constructor(eventEmitter: EventEmitter2, config?: AuggieAdapterConfig);
    getSupportedProtocol(): ProtocolType;
    translateToAuggie(message: A2AMessage): Promise<AuggieTaskRequest>;
    executeAndTranslate(message: A2AMessage): Promise<A2AMessage>;
    private executeAuggieTask;
    private executeCodeAnalysis;
    private executeTask;
    private executeQuery;
    private translateTaskAssignment;
    private translateCodeAnalysis;
    private translateCodeGeneration;
    private translateDebugRequest;
    private translateRefactorRequest;
    private translateDocumentationRequest;
    private translateTestGeneration;
    private translateGenericTask;
    private translateToA2A;
    private createErrorResponse;
    getCapabilities(): string[];
    getConfig(): AuggieAdapterConfig;
    updateConfig(config: Partial<AuggieAdapterConfig>): void;
}
//# sourceMappingURL=AuggieCLIAdapter.d.ts.map