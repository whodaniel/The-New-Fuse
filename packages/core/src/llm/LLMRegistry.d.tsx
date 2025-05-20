import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { LLMConfig } from './LLMProvider.js';
export interface ExtendedLLMConfig extends LLMConfig {
    provider: string;
    enabled: boolean;
    priority: number;
    retryConfig?: {
        maxAttempts: number;
        initialDelay: number;
        maxDelay: number;
        backoffFactor: number;
    };
    rateLimit?: {
        requestsPerMinute: number;
        tokensPerMinute: number;
    };
    metadata?: Record<string, unknown>;
    modelName: string;
}
export declare class LLMRegistry extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private providers;
    private configs;
    private stats;
    private rateLimiters;
    constructor();
    for(: any, config: any, of: any, configs: unknown): void;
}
