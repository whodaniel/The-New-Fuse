/**
 * Auggie CLI Service
 *
 * Service for interacting with Augment Code's auggie CLI programmatically.
 * Provides AI-powered coding assistance, code generation, and development workflow automation.
 *
 * @module AuggieCLIService
 * @since 2025-10-06
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface AuggieCLIConfig {
    model?: 'claude-sonnet-4' | 'claude-haiku-3' | 'claude-opus-3';
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    cliPath?: string;
    apiKey?: string;
}
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
export declare class AuggieCLIService {
    private readonly eventEmitter;
    private readonly logger;
    private config;
    private isAuthenticated;
    constructor(eventEmitter: EventEmitter2, config?: AuggieCLIConfig);
    /**
     * Check if Auggie CLI is installed
     */
    isInstalled(): Promise<boolean>;
}
//# sourceMappingURL=AuggieCLIService.d.ts.map