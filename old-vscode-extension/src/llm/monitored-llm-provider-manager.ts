import { LLMProviderInfo, GenerateOptions } from '../types/llm.js';
import { Logger } from '../core/logging.js';
import { LLMProviderManager } from './LLMProviderManager.js';
import { getErrorMessage } from '../utils/error-utils.js';

export interface MonitoredProviderMetrics {
    totalRequests: number;
    averageLatency: number;
    errorRate: number;
    lastUsed: Date;
}

export class MonitoredLLMProviderManager extends LLMProviderManager {
    private metrics: Map<string, MonitoredProviderMetrics> = new Map();
    // Use the logger from the parent class instead of creating a new one

    private readonly logger: Logger;

    constructor() {
        super();
        this.logger = new Logger('MonitoredLLMProviderManager');
    }

    public override async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        const startTime = Date.now();
        const provider = await this.getCurrentProvider();
        if (!provider) {
            throw new Error('No LLM provider available');
        }

        try {
            const result = await super.generate(prompt, options);
            this.updateMetrics(provider.name, Date.now() - startTime, true);
            return result;
        } catch (error) {
            this.updateMetrics(provider.name, Date.now() - startTime, false);
            this.logger.error('Generation error:', getErrorMessage(error));
            throw error;
        }
    }

    private updateMetrics(providerName: string, latency: number, success: boolean): void {
        const currentMetrics = this.metrics.get(providerName) || {
            totalRequests: 0,
            averageLatency: 0,
            errorRate: 0,
            lastUsed: new Date()
        };

        const newTotalRequests = currentMetrics.totalRequests + 1;
        const newAverageLatency = (currentMetrics.averageLatency * currentMetrics.totalRequests + latency) / newTotalRequests;
        const newErrorRate = success
            ? (currentMetrics.errorRate * currentMetrics.totalRequests) / newTotalRequests
            : (currentMetrics.errorRate * currentMetrics.totalRequests + 1) / newTotalRequests;

        this.metrics.set(providerName, {
            totalRequests: newTotalRequests,
            averageLatency: newAverageLatency,
            errorRate: newErrorRate,
            lastUsed: new Date()
        });

        this.logger.debug('Provider metrics updated:', {
            provider: providerName,
            metrics: this.metrics.get(providerName)
        });
    }

    public getProviderMetrics(providerName: string): MonitoredProviderMetrics | undefined {
        return this.metrics.get(providerName);
    }

    public getAllMetrics(): Map<string, MonitoredProviderMetrics> {
        return new Map(this.metrics);
    }

    public override async getCurrentProviderInfo(): Promise<LLMProviderInfo | undefined> {
        try {
            const provider = await this.getCurrentProvider();
            if (!provider) {
                return undefined;
            }
            const info = await provider.getInfo();
            const metrics = this.getProviderMetrics(provider.name);
            return {
                id: info.id,
                name: info.name,
                version: info.version,
                maxTokens: info.maxTokens,
                isAvailable: info.isAvailable,
                models: info.models,
                description: info.description,
                capabilities: info.capabilities,
                status: info.isAvailable ? 'available' : 'unavailable',
                metadata: {
                    ...(info.metadata || {}),
                    metrics
                }
            };
        } catch (error) {
            this.logger.error('Failed to get current provider info:', getErrorMessage(error));
            return undefined;
        }
    }
}