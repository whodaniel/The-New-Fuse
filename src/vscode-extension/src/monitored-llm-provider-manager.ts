import { LLMProvider, LLMProviderInfo, GenerateOptions, LLMMetrics } from './types/llm.js';
import { LLMProviderManager } from './llm-provider-manager.js';

interface ProviderMetrics {
    totalCalls: number;
    totalTokens: number;
    averageLatency: number;
    lastUsed: Date;
    errors: number;
}

// Extend LLMProviderInfo to include metrics
interface EnhancedLLMProviderInfo extends LLMProviderInfo {
    metrics?: {
        totalCalls: number;
        totalTokens: number;
        averageLatency: number;
        lastUsed: string;
        errorRate: number;
    };
}

export class MonitoredLLMProviderManager extends LLMProviderManager {
    private metrics: Map<string, ProviderMetrics>;

    constructor() {
        super();
        this.metrics = new Map();
    }

    public override async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        const startTime = Date.now();
        const provider = await this.getCurrentProvider();
        
        if (!provider) {
            throw new Error('No LLM provider available');
        }

        try {
            const result = await super.generate(prompt, options);
            this.updateMetrics(provider.id, {
                latency: Date.now() - startTime,
                tokens: this.estimateTokens(prompt, result),
                success: true
            });
            return result;
        } catch (error) {
            this.updateMetrics(provider.id, {
                latency: Date.now() - startTime,
                tokens: 0,
                success: false
            });
            throw error;
        }
    }

    private updateMetrics(providerId: string, data: { latency: number; tokens: number; success: boolean }): void {
        const current = this.metrics.get(providerId) || {
            totalCalls: 0,
            totalTokens: 0,
            averageLatency: 0,
            lastUsed: new Date(),
            errors: 0
        };

        current.totalCalls++;
        current.totalTokens += data.tokens;
        current.averageLatency = (current.averageLatency * (current.totalCalls - 1) + data.latency) / current.totalCalls;
        current.lastUsed = new Date();
        if (!data.success) {
            current.errors++;
        }

        this.metrics.set(providerId, current);
        this.logger.debug('Provider metrics updated:', {
            providerId,
            metrics: current
        });
    }

    public override async getCurrentProviderInfo(): Promise<EnhancedLLMProviderInfo | undefined> {
        try {
            const provider = await this.getCurrentProvider();
            if (!provider) {
                return undefined;
            }

            const baseInfo = await super.getCurrentProviderInfo();
            const metrics = this.metrics.get(provider.id);

            return {
                ...baseInfo!,
                metrics: metrics ? {
                    totalCalls: metrics.totalCalls,
                    totalTokens: metrics.totalTokens,
                    averageLatency: metrics.averageLatency,
                    lastUsed: metrics.lastUsed.toISOString(),
                    errorRate: metrics.totalCalls > 0 ? metrics.errors / metrics.totalCalls : 0
                } : undefined
            };
        } catch (error) {
            this.logger.error('Failed to get current provider info:', error);
            return undefined;
        }
    }

    private estimateTokens(prompt: string, response: string): number {
        // Simple estimation: ~4 characters per token on average
        return Math.ceil((prompt.length + response.length) / 4);
    }

    public getMetrics(providerId: string): ProviderMetrics | undefined {
        return this.metrics.get(providerId);
    }

    public override dispose(): void {
        super.dispose();
        this.metrics.clear();
    }
}