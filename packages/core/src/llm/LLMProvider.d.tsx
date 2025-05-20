import { Logger } from '@the-new-fuse/utils';
import { EventEmitter } from 'events';
export interface LLMConfig {
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stop?: string[];
    apiKey?: string;
    apiEndpoint?: string;
    apiVersion?: string;
    organization?: string;
}
export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    metadata?: Record<string, unknown>;
}
export interface LLMContext {
    messages: Array<{
        role: system' | 'user' | 'assistant';
        content: string;
        name?: string;
    }>;
    functions?: Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>;
    tools?: Array<{
        type: string;
        function: {
            name: string;
            description: string;
            parameters: Record<string, unknown>;
        };
    }>;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    metadata?: Record<string, unknown>;
}
export interface StreamChunk {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    metadata?: Record<string, unknown>;
}
export declare abstract class BaseLLMProvider extends EventEmitter {
    protected logger: Logger;
    protected config: LLMConfig;
    protected isInitialized: boolean;
    constructor(config: LLMConfig);
    protected validateConfig(): void;
}
