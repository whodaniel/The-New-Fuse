/**
 * Codex CLI Adapter
 *
 * Protocol adapter for translating between A2A messages and OpenAI Codex CLI commands.
 * Enables seamless integration of OpenAI's code generation capabilities into the agent ecosystem.
 *
 * @module CodexCLIAdapter
 * @since 2025-10-06
 */
import { ProtocolType } from '../types/prisma-enums';
import { A2AMessage } from '@the-new-fuse/a2a-core';
export interface CodexCLIConfig {
    defaultModel?: 'gpt-4o' | 'gpt-4' | 'gpt-3.5-turbo';
    defaultTemperature?: number;
    apiKey?: string;
    organization?: string;
    project?: string;
    enableCodeExecution?: boolean;
    enableWebSearch?: boolean;
    maxTokens?: number;
    timeout?: number;
}
export interface CodexTaskRequest {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    taskType: 'query' | 'code_analysis' | 'code_generation' | 'debug' | 'refactor' | 'explanation' | 'web_search';
    context?: any;
    sessionId?: string;
    metadata?: Record<string, any>;
}
export interface CodexTaskResponse {
    sessionId: string;
    status: 'created' | 'running' | 'completed' | 'failed';
    prompt: string;
    result?: string;
    error?: string;
    model?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    createdAt: Date;
    completedAt?: Date;
    metadata?: Record<string, any>;
}
export interface CodexSessionStatus {
    id: string;
    prompt: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress?: number;
    currentStep?: string;
    error?: string;
    model?: string;
}
/**
 * Codex CLI Adapter for A2A Protocol Translation
 */
export declare class CodexCLIAdapter {
    readonly name = "CodexCLIAdapter";
    readonly version = "1.0.0";
    readonly supportedProtocols: ProtocolType[];
    private readonly logger;
    private config;
    constructor(config?: CodexCLIConfig);
    /**
     * Get supported protocol
     */
    getSupportedProtocol(): ProtocolType;
    /**
     * Translate A2A message to Codex task
     */
    translateToCodex(message: A2AMessage): Promise<CodexTaskRequest>;
    /**
     * Translate Codex response back to A2A message
     */
    translateFromCodex(response: CodexTaskResponse, originalMessage: A2AMessage): Promise<A2AMessage>;
    /**
     * Execute A2A message with Codex
     */
    executeMessage(message: A2AMessage): Promise<A2AMessage>;
    /**
     * Execute query task
     */
    private executeQuery;
    /**
     * Execute code analysis task
     */
    private executeCodeAnalysis;
    /**
     * Execute code generation task
     */
    private executeCodeGeneration;
    /**
     * Execute debug task
     */
    private executeDebug;
    /**
     * Execute refactor task
     */
    private executeRefactor;
    /**
     * Execute explanation task
     */
    private executeExplanation;
    /**
     * Execute web search task
     */
    private executeWebSearch;
    /**
     * Simulate Codex execution (replace with actual API calls)
     */
    private simulateCodexExecution;
    /**
     * Translate task assignment
     */
    private translateTaskAssignment;
    /**
     * Translate code analysis
     */
    private translateCodeAnalysis;
    /**
     * Translate code generation
     */
    private translateCodeGeneration;
    /**
     * Translate debug request
     */
    private translateDebugRequest;
    /**
     * Translate refactor request
     */
    private translateRefactorRequest;
    /**
     * Translate data request
     */
    private translateDataRequest;
    /**
     * Build prompt from task payload
     */
    private buildPromptFromTask;
    /**
     * Map Codex status to A2A message type
     */
    private mapStatusToA2AType;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Validate task request
     */
    validateTask(task: CodexTaskRequest): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Build CLI command for Codex
     */
    buildCLICommand(task: CodexTaskRequest): string;
    /**
     * Parse session output
     */
    parseSessionOutput(output: string): {
        sessionId?: string;
        status: string;
        message: string;
    };
    /**
     * Check if protocol is supported
     */
    supportsProtocol(protocol: ProtocolType): boolean;
    /**
     * Get adapter capabilities
     */
    getCapabilities(): string[];
    /**
     * Get adapter configuration
     */
    getConfig(): CodexCLIConfig;
    /**
     * Update adapter configuration
     */
    updateConfig(config: Partial<CodexCLIConfig>): void;
    /**
     * Create error response
     */
    private createErrorResponse;
}
//# sourceMappingURL=CodexCLIAdapter.d.ts.map