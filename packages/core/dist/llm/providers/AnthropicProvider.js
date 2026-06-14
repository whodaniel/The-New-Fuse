var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AnthropicProvider_1;
import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider } from '../LLMProvider.js';
import { assertDevLoopBudget } from '../../utils/dev-loop-guard.js';
import { loadRootEnv } from '../../utils/root-env.js';
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
let AnthropicProvider = AnthropicProvider_1 = class AnthropicProvider extends LLMProvider {
    constructor(config) {
        super();
        this.config = config;
        this.logger = new Logger(AnthropicProvider_1.name);
        loadRootEnv();
        this.client = new Anthropic({
            apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY || '',
            baseURL: config.baseURL,
            maxRetries: config.maxRetries ?? 3,
            timeout: config.timeout ?? 600000, // 10 minutes for long-running tasks
        });
    }
    /**
     * Generate completion from prompt
     */
    async generate(prompt) {
        assertDevLoopBudget('core.anthropic.generate', this.config);
        try {
            const response = await this.client.messages.create({
                model: this.config.modelName || 'claude-3-5-sonnet-20241022',
                max_tokens: this.config.maxTokens || 8192,
                temperature: this.config.temperature ?? 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            const textContent = response.content.find((block) => block.type === 'text');
            if (!textContent || textContent.type !== 'text') {
                throw new Error('No text content in response');
            }
            return textContent.text;
        }
        catch (error) {
            this.logger.error('Failed to generate completion from Anthropic', error);
            throw error;
        }
    }
    /**
     * Chat completion with message history
     */
    async chat(messages, config) {
        assertDevLoopBudget('core.anthropic.chat', config);
        try {
            const mergedConfig = { ...this.config, ...config };
            // Convert messages to Anthropic format
            const anthropicMessages = this.convertMessages(messages);
            // Extract system message if present
            const systemMessage = messages.find((m) => m.role === 'system');
            const response = await this.client.messages.create({
                model: mergedConfig.modelName || 'claude-3-5-sonnet-20241022',
                max_tokens: mergedConfig.maxTokens || 8192,
                temperature: mergedConfig.temperature ?? 0.7,
                top_p: mergedConfig.topP,
                stop_sequences: mergedConfig.stopSequences,
                system: systemMessage?.content,
                messages: anthropicMessages,
            });
            const textContent = response.content.find((block) => block.type === 'text');
            if (!textContent || textContent.type !== 'text') {
                throw new Error('No text content in response');
            }
            return {
                content: textContent.text,
                usage: {
                    promptTokens: response.usage.input_tokens,
                    completionTokens: response.usage.output_tokens,
                    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
                },
                metadata: {
                    model: response.model,
                    stopReason: response.stop_reason,
                    id: response.id,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to complete chat with Anthropic', error);
            throw error;
        }
    }
    /**
     * Stream chat completion
     */
    async *streamChat(messages, config) {
        assertDevLoopBudget('core.anthropic.streamChat', config);
        try {
            const mergedConfig = { ...this.config, ...config };
            const anthropicMessages = this.convertMessages(messages);
            const systemMessage = messages.find((m) => m.role === 'system');
            const stream = await this.client.messages.create({
                model: mergedConfig.modelName || 'claude-3-5-sonnet-20241022',
                max_tokens: mergedConfig.maxTokens || 8192,
                temperature: mergedConfig.temperature ?? 0.7,
                top_p: mergedConfig.topP,
                stop_sequences: mergedConfig.stopSequences,
                system: systemMessage?.content,
                messages: anthropicMessages,
                stream: true,
            });
            for await (const event of stream) {
                if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                    yield event.delta.text;
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to stream chat with Anthropic', error);
            throw error;
        }
    }
    /**
     * Convert LLMMessage[] to Anthropic message format
     */
    convertMessages(messages) {
        return messages
            .filter((m) => m.role !== 'system') // System messages handled separately
            .map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
        }));
    }
    /**
     * Count tokens in text (approximate)
     * Anthropic uses Claude-specific tokenizer, this is an approximation
     */
    async countTokens(text) {
        // Approximate: 1 token ≈ 4 characters for English text
        // More accurate would be to use Anthropic's token counting API
        return Math.ceil(text.length / 4);
    }
    /**
     * Get maximum context length for model
     */
    getContextLength() {
        const model = this.config.modelName || 'claude-3-5-sonnet-20241022';
        // Context lengths as of January 2026
        if (model.includes('opus'))
            return 200000;
        if (model.includes('sonnet'))
            return 200000;
        if (model.includes('haiku'))
            return 200000;
        return 200000; // Default to 200K
    }
    /**
     * Check if model supports vision
     */
    supportsVision() {
        const model = this.config.modelName || 'claude-3-5-sonnet-20241022';
        // All Claude 3+ models support vision
        return model.includes('claude-3');
    }
    /**
     * Check if model supports prompt caching
     */
    supportsPromptCaching() {
        // All Claude 3+ models support prompt caching
        return true;
    }
    /**
     * Get model information
     */
    getModelInfo() {
        const model = this.config.modelName || 'claude-3-5-sonnet-20241022';
        return {
            provider: 'anthropic',
            model,
            contextLength: this.getContextLength(),
            supportsVision: this.supportsVision(),
            supportsPromptCaching: this.supportsPromptCaching(),
            supportsStreaming: true,
            maxTokens: this.config.maxTokens || 8192,
        };
    }
};
AnthropicProvider = AnthropicProvider_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object])
], AnthropicProvider);
export { AnthropicProvider };
//# sourceMappingURL=AnthropicProvider.js.map