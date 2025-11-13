/**
 * Gemini CLI Service
 *
 * Service for interacting with Google Gemini CLI programmatically.
 * Provides advanced AI capabilities including code analysis, reasoning, and multimodal processing.
 *
 * @module GeminiCLIService
 * @since 2025-10-05
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface GeminiCLIConfig {
    model?: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-exp-1206';
    temperature?: number;
    maxTokens?: number;
    systemInstruction?: string;
    cliPath?: string;
}
export interface GeminiQueryOptions {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemInstruction?: string;
    files?: string[];
    webSearch?: boolean;
    codeExecution?: boolean;
}
export interface GeminiResponse {
    content: string;
    model: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
    timestamp: Date;
}
export interface GeminiCodeAnalysisOptions {
    filePath: string;
    analysisType: 'review' | 'optimize' | 'explain' | 'security' | 'test';
    context?: string;
}
export interface GeminiMultimodalOptions {
    prompt: string;
    images?: string[];
    documents?: string[];
    codeFiles?: string[];
}
export declare class GeminiCLIService {
    private readonly eventEmitter;
    private readonly logger;
    private config;
    private isAuthenticated;
    constructor(eventEmitter: EventEmitter2, config?: GeminiCLIConfig);
    /**
     * Check if Gemini CLI is installed
     */
    isInstalled(): Promise<boolean>;
}
//# sourceMappingURL=GeminiCLIService.d.ts.map