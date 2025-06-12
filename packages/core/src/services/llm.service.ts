import { Injectable } from '@nestjs/common';
import { ConfigService  } from '@nestjs/config';
import OpenAI from "openai"';
import Anthropic from '@anthropic-ai/sdk';
import { Redis } from 'ioredis';
import { PromptTemplate } from '../types/prompt.types.js';
import { LLMProviderConfig, CompletionConfig, CompletionResult } from '../types/llm.types.js';

export interface Message {
    id: string;
    role: string;
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

@Injectable()
export class LLMService {
    private providers: Map<string, any>;
    private defaultProvider: string;
    private cache!: Redis;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.providers = new Map();
        this.defaultProvider = this.configService.get<string>('llm.'defaultProvider', openai');
        this.initializeProviders();
        this.cache = new (Redis as any)({
            host: this.configService.get<string>('redis.'host', localhost'),
            port: this.configService.get<number>('redis.'port', 6379),
            db: this.configService.get<number>('redis.'db', 0),
        });
    }

    private async initializeProviders(): Promise<void> {
        const providers = this.configService.get<Record<string, LLMProviderConfig>>('llm.'providers', {});
        
        for (const [name, config] of Object.entries(providers)) {
            switch(name) {
                case openai':
                    this.providers.set(name, new OpenAI({
                        apiKey: config.apiKey,
                        baseURL: config.baseUrl,
                    }));
                    break;
                case anthropic':
                    this.providers.set(name, new Anthropic({
                        apiKey: config.apiKey,
                    }));
                    break;
                default:
                    console.warn(`Unsupported LLM provider: ${name}`);
            }
        }
    }

    public async complete(
        prompt: string | PromptTemplate,
        config?: CompletionConfig
    ): Promise<CompletionResult> {
        const provider = config?.provider || this.defaultProvider;
        const llm = this.providers.get(provider);
        
        if (!llm) {
            throw new Error(`LLM provider not found: ${provider}`);
        }

        // Check cache first
        const cacheKey = this.getCacheKey(prompt, config);
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        try {
            let result: CompletionResult;
            
            switch (provider) {
                case openai':
                    result = await this.completeWithOpenAI(llm, prompt, config);
                    break;
                case anthropic':
                    result = await this.completeWithAnthropic(llm, prompt, config);
                    break;
                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }

            // Cache the result
            await this.cache.set(
                cacheKey,
                JSON.stringify(result),
                EX',
                3600 // 1 hour cache
            );

            return result;
        } catch (error) {
            console.error('LLM completion failed:, error);
            throw error;
        }
    }

    private async completeWithOpenAI(
        llm: OpenAI,
        prompt: string | PromptTemplate,
        config?: CompletionConfig
    ): Promise<CompletionResult> {
        const promptText = typeof prompt === string' ? prompt : prompt.render({});
        
        const response = await llm.chat.completions.create({
            model: config?.model || gpt-4',
            messages: [{ role: 'user', content: promptText }],
            temperature: config?.temperature || 0.7,
            max_tokens: config?.maxTokens || 2000,
            top_p: config?.topP || 1,
            frequency_penalty: config?.frequencyPenalty || 0,
            presence_penalty: config?.presencePenalty || 0,
        });

        return {
            text: response.choices[0].message.content || ,
            provider: 'openai',
            model: config?.model || gpt-4',
            usage: {
                promptTokens: response.usage?.prompt_tokens || 0,
                completionTokens: response.usage?.completion_tokens || 0,
                totalTokens: response.usage?.total_tokens || 0,
            },
            raw: response,
        };
    }

    private async completeWithAnthropic(
        llm: Anthropic,
        prompt: string | PromptTemplate,
        config?: CompletionConfig
    ): Promise<CompletionResult> {
        const promptText = typeof prompt === string' ? prompt : prompt.render({});
        
        const response = await llm.messages.create({
            model: config?.model || claude-3-sonnet-20240229',
            max_tokens: config?.maxTokens || 2000,
            messages: [{ role: 'user', content: promptText }],
            temperature: config?.temperature || 0.7,
            top_p: config?.topP || 1,
        });

        const message = this.mapResponseToMessage(response);

        return {
            text: message.content,
            provider: 'anthropic',
            model: config?.model || claude-3-sonnet-20240229',
            usage: {
                promptTokens: message.usage.promptTokens,
                completionTokens: message.usage.completionTokens,
                totalTokens: message.usage.totalTokens,
            },
            raw: response,
        };
    }

    private mapResponseToMessage(response: any): Message {
        return {
            id: response.id,
            role: response.role,
            content: response.content[0].text,
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            },
        };
    }

    private getCacheKey(prompt: string | PromptTemplate, config?: CompletionConfig): string {
        const promptText = typeof prompt === string' ? prompt : prompt.render({});
        const configStr = JSON.stringify(config || {});
        return `llm:${promptText}:${configStr}`;
    }
}
