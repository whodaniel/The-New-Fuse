import { Logger } from '@nestjs/common';
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { LLMProvider } from '../LLMProvider.js';
import { LLMMessage, LLMResponse, LLMConfig } from '@the-new-fuse/types';
export interface GeminiConfig extends LLMConfig {
    apiKey: string;
    baseURL?: string;
    safetySettings?: Array<{
        category: HarmCategory;
        threshold: HarmBlockThreshold;
    }>;
}
/**
 * Google Gemini Provider
 *
 * Supports Gemini models:
 * - gemini-2.0-flash-exp (Latest Flash, fastest)
 * - gemini-1.5-pro-latest (Pro, most capable)
 * - gemini-1.5-flash-latest (Flash, balanced)
 *
 * Features:
 * - Multimodal support (text, images, video, audio)
 * - Extended context (2M tokens for 1.5 Pro)
 * - Function calling
 * - Streaming
 * - Grounding with Google Search
 */
export declare class GeminiProvider extends LLMProvider {
    private readonly config;
    private client;
    private model;
    protected readonly logger: Logger;
    constructor(config: GeminiConfig);
    /**
     * Generate completion from prompt
     */
    generate(prompt: string): Promise<string>;
    /**
     * Chat completion with message history
     */
    chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse>;
    /**
     * Stream chat completion
     */
    streamChat(messages: LLMMessage[], config?: Partial<LLMConfig>): AsyncGenerator<string, void, unknown>;
    /**
     * Convert LLMMessage[] to Gemini message format
     */
    private convertMessages;
    /**
     * Get default safety settings (permissive for development)
     */
    private getDefaultSafetySettings;
    /**
     * Count tokens in text (approximate)
     */
    countTokens(text: string): Promise<number>;
    /**
     * Get maximum context length for model
     */
    getContextLength(): number;
    /**
     * Check if model supports vision
     */
    supportsVision(): boolean;
    /**
     * Check if model supports function calling
     */
    supportsFunctionCalling(): boolean;
    /**
     * Check if model supports grounding (Google Search)
     */
    supportsGrounding(): boolean;
    /**
     * Get model information
     */
    getModelInfo(): {
        provider: string;
        model: string;
        contextLength: number;
        supportsVision: boolean;
        supportsFunctionCalling: boolean;
        supportsGrounding: boolean;
        supportsStreaming: boolean;
        maxTokens: number;
    };
    /**
     * Generate content with multimodal input (text + images/video/audio)
     */
    generateMultimodal(parts: Array<{
        text?: string;
        inlineData?: {
            mimeType: string;
            data: string;
        };
    }>): Promise<string>;
}
//# sourceMappingURL=GeminiProvider.d.ts.map