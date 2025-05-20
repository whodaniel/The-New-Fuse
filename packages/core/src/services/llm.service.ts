import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { Redis } from 'ioredis';
import { PromptTemplate } from '../types/prompt.types.js';
import { LLMProviderConfig, CompletionConfig, CompletionResult, Message } from '../types/llm.types.js';

@Injectable()
export class LLMService {
    private providers: Map<string, any>;
    private defaultProvider: string;
    private cache!: Redis;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.providers = new Map();
        this.defaultProvider = this.configService.get<string>('llm.defaultProvider', 'openai');
        this.initializeProviders();
        this.cache = new Redis({
            host: this.configService.get<string>('redis.host', 'localhost'),
            port: this.configService.get<number>('redis.port', 6379),
            db: this.configService.get<number>('redis.db', 0),
        });
    }

    private async initializeProviders(): Promise<void> {): Promise<any> {
        const providers: unknown){
                case 'openai':
                    this.providers.set(name, new OpenAI({
                        apiKey: config.apiKey,
                        baseURL: config.baseUrl,
                    }): this.providers.set(name, new Anthropic( {
                        apiKey: config.apiKey,
                    }));
                    break;
                default:
                    console.warn(`Unsupported LLM provider: ${name}`): string | PromptTemplate,
        config?: CompletionConfig
    ): Promise<CompletionResult> {
        const provider: ${provider}`);
        }

        // Check cache first
        const cacheKey   = this.configService.get<Record<string, LLMProviderConfig>>('llm.providers', {});
        
        for (const [name, config] of Object.entries(providers)) {
            switch(name config?.provider || this.defaultProvider;
        const llm this.providers.get(provider)): void {
            throw new Error(`LLM provider not found this.getCacheKey(prompt, config): CompletionResult;
            
            switch (provider): void {
                case 'openai':
                    result  = await this.cache.get(cacheKey)): void {
            return JSON.parse(cached);
        }

        try {
            let result await this.completeWithOpenAI(llm, prompt, config): result = await this.completeWithAnthropic(llm, prompt, config);
                    break;
                default:
                    throw new Error(`Unsupported provider: $ {provider}`);
            }

            // Cache the result
            await this.cache.set(
                cacheKey,
                JSON.stringify(result)): void {
            console.error('LLM completion failed:', error): OpenAI,
        prompt: string | PromptTemplate,
        config?: CompletionConfig
    ): Promise<CompletionResult> {
        const promptText: prompt.render({}): config?.model || 'gpt-4',
            messages: [ { role: user', content: promptText }],
            temperature: config?.temperature || 0.7,
            max_tokens: config?.maxTokens || 2000,
            top_p: config?.topP || 1,
            frequency_penalty: config?.frequencyPenalty || 0,
            presence_penalty: config?.presencePenalty || 0,
        });

        return {
            text: response.choices[0].message.content,
            provider: openai',
            model: config?.model || 'gpt-4',
            usage: {
                promptTokens: (response as any).usage.prompt_tokens,
                completionTokens: (response as any).usage.completion_tokens,
                totalTokens: (response as any).usage.total_tokens,
            },
            raw: response,
        };
    }

    private async completeWithAnthropic(): Promise<void> {
        llm: Anthropic,
        prompt: string | PromptTemplate,
        config?: CompletionConfig
    ): Promise<CompletionResult> {
        const promptText: prompt.render({});
        
        const response   = typeof prompt === 'string' ? prompt  await llm.chat.completions.create({
            model typeof prompt === 'string' ? prompt  await (llm as any).messages.create({
            model: config?.model || 'claude-3',
            max_tokens: config?.maxTokens || 2000,
            messages: [{ role: user', content: promptText }],
            temperature: config?.temperature || 0.7,
            top_p: config?.topP || 1,
        });

        const message: message.content,
            provider: anthropic',
            model: config?.model || 'claude-3',
            usage: {
                promptTokens: (message as any).usage.promptTokens,
                completionTokens: (message as any).usage.completionTokens,
                totalTokens: (message as any).usage.totalTokens,
            },
            raw: response,
        };
    }

    private mapResponseToMessage(response: unknown): Message {
        return {
          id: response.id,
          role: response.role,
          content: response.content[0].value,
          usage: {
            promptTokens: (response as any).usage.input_tokens,
            completionTokens: (response as any).usage.output_tokens,
            totalTokens: (response as any).usage.total_tokens,
          },
        };
    }

    private getCacheKey(prompt: string | PromptTemplate, config?: CompletionConfig): string {
        const promptText  = this.mapResponseToMessage(response);

        return {
            text typeof prompt === 'string' ? prompt : prompt.render({}): unknown): ';
        return `llm:$ {promptText}:${configStr}`;
    }
}
