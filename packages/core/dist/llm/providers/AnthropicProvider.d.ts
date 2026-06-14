import { Logger } from '@nestjs/common';
import { LLMProvider } from '../LLMProvider.js';
import { LLMMessage, LLMResponse, LLMConfig } from '@the-new-fuse/types';
export interface AnthropicConfig extends LLMConfig {
    apiKey: string;
    baseURL?: string;
    maxRetries?: number;
    timeout?: number;
}
/**
 * Anthropic Claude Provider
 *
 * Supports all Claude models:
 * - claude-3-opus-20240229 (Opus)
 * - claude-3-5-sonnet-20241022 (Sonnet 3.5)
 * - claude-3-5-haiku-20241022 (Haiku 3.5)
 * - claude-3-haiku-20240307 (Haiku)
 *
 * Features:
 * - Streaming support
 * - Prompt caching
 * - Extended context (200K tokens)
 * - Vision capabilities
 */
export declare class AnthropicProvider extends LLMProvider {
    private readonly config;
    private client;
    protected readonly logger: Logger;
    constructor(config: AnthropicConfig);
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
     * Convert LLMMessage[] to Anthropic message format
     */
    private convertMessages;
    /**
     * Count tokens in text (approximate)
     * Anthropic uses Claude-specific tokenizer, this is an approximation
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
     * Check if model supports prompt caching
     */
    supportsPromptCaching(): boolean;
    /**
     * Get model information
     */
    getModelInfo(): {
        provider: string;
        model: string;
        contextLength: number;
        supportsVision: boolean;
        supportsPromptCaching: boolean;
        supportsStreaming: boolean;
        maxTokens: number;
    };
}
//# sourceMappingURL=AnthropicProvider.d.ts.map