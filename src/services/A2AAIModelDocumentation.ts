import { Injectable } from '@nestjs/common';
import { A2ALogger } from './A2ALogger.js';
import { RedisClient } from './RedisClient.js';

@Injectable()
export class A2AAIModelDocumentation {
    private readonly modelKey = 'a2a:ai:models:';
    private readonly usageKey = 'a2a:ai:usage:';

    constructor(
        private logger: A2ALogger,
        private redis: RedisClient
    ) {}

    async documentModelUsage(modelData: AIModelUsage): Promise<void> {
        const key = `${this.usageKey}${modelData.modelId}:${Date.now()}`;
        await this.redis.set(key, JSON.stringify(modelData));
        await this.updateModelStats(modelData);
    }

    async getModelDocumentation(modelId: string): Promise<AIModelDocumentation> {
        const key = `${this.modelKey}${modelId}`;
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async getAllModels(): Promise<AIModelSummary[]> {
        const keys = await this.redis.keys(`${this.modelKey}*`);
        const models: AIModelSummary[] = [];

        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                const model = JSON.parse(data);
                models.push({
                    modelId: model.modelId,
                    name: model.name,
                    version: model.version,
                    type: model.type,
                    capabilities: model.capabilities
                });
            }
        }

        return models;
    }

    async updateModelStats(usage: AIModelUsage): Promise<void> {
        const key = `${this.modelKey}${usage.modelId}`;
        const data = await this.redis.get(key);
        if (data) {
            const model = JSON.parse(data);
            model.stats = this.calculateNewStats(model.stats, usage);
            await this.redis.set(key, JSON.stringify(model));
        }
    }

    async registerModel(model: AIModelRegistration): Promise<void> {
        const documentation: AIModelDocumentation = {
            modelId: model.modelId,
            name: model.name,
            version: model.version,
            type: model.type,
            description: model.description,
            capabilities: model.capabilities,
            parameters: model.parameters,
            constraints: model.constraints,
            integrationDetails: model.integrationDetails,
            stats: this.initializeModelStats(),
            updateHistory: [{
                timestamp: Date.now(),
                version: model.version,
                changes: ['Initial registration']
            }]
        };

        const key = `${this.modelKey}${model.modelId}`;
        await this.redis.set(key, JSON.stringify(documentation));
    }

    private initializeModelStats(): AIModelStats {
        return {
            totalCalls: 0,
            averageLatency: 0,
            successRate: 0,
            lastUsed: null,
            errorRates: {},
            usageByEndpoint: {},
            performanceMetrics: {
                p50Latency: 0,
                p95Latency: 0,
                p99Latency: 0
            }
        };
    }

    private calculateNewStats(
        currentStats: AIModelStats,
        usage: AIModelUsage
    ): AIModelStats {
        const newStats = { ...currentStats };
        newStats.totalCalls++;
        newStats.lastUsed = Date.now();

        // Update latency metrics
        const totalLatency = currentStats.averageLatency * (currentStats.totalCalls - 1);
        newStats.averageLatency = (totalLatency + usage.latency) / newStats.totalCalls;

        // Update success rate
        const successCount = currentStats.successRate * (currentStats.totalCalls - 1);
        newStats.successRate = (successCount + (usage.success ? 1 : 0)) / newStats.totalCalls;

        // Update endpoint usage
        const endpoint = usage.endpoint || 'default';
        newStats.usageByEndpoint[endpoint] = (newStats.usageByEndpoint[endpoint] || 0) + 1;

        // Update error rates if applicable
        if (!usage.success && usage.errorType) {
            newStats.errorRates[usage.errorType] = 
                (newStats.errorRates[usage.errorType] || 0) + 1;
        }

        return newStats;
    }
}

interface AIModelRegistration {
    modelId: string;
    name: string;
    version: string;
    type: string;
    description: string;
    capabilities: string[];
    parameters: Record<string, any>;
    constraints: {
        maxTokens?: number;
        timeout?: number;
        rateLimit?: number;
    };
    integrationDetails: {
        endpoint?: string;
        authMethod?: string;
        requirements?: string[];
    };
}

interface AIModelDocumentation extends AIModelRegistration {
    stats: AIModelStats;
    updateHistory: ModelUpdate[];
}

interface AIModelStats {
    totalCalls: number;
    averageLatency: number;
    successRate: number;
    lastUsed: number | null;
    errorRates: Record<string, number>;
    usageByEndpoint: Record<string, number>;
    performanceMetrics: {
        p50Latency: number;
        p95Latency: number;
        p99Latency: number;
    };
}

interface AIModelUsage {
    modelId: string;
    timestamp: number;
    endpoint?: string;
    latency: number;
    success: boolean;
    errorType?: string;
    metadata?: Record<string, any>;
}

interface AIModelSummary {
    modelId: string;
    name: string;
    version: string;
    type: string;
    capabilities: string[];
}

interface ModelUpdate {
    timestamp: number;
    version: string;
    changes: string[];
}