import { Injectable } from '@nestjs/common';
import { A2ALogger } from './A2ALogger.js';
import { RedisClient } from './RedisClient.js';

@Injectable()
export class A2AInteractionAnalyzer {
    private readonly interactionKey = 'a2a:interactions:';
    private readonly patternKey = 'a2a:patterns:';

    constructor(
        private logger: A2ALogger,
        private redis: RedisClient
    ) {}

    async recordInteraction(interaction: AgentInteraction): Promise<void> {
        const key = `${this.interactionKey}${Date.now()}`;
        await this.redis.set(key, JSON.stringify(interaction));
        await this.analyzePattern(interaction);
    }

    async analyzeInteractions(timeframe?: number): Promise<InteractionAnalysis> {
        const patterns = await this.getPatterns();
        const metrics = await this.calculateMetrics();
        const insights = await this.generateInsights();

        return {
            timestamp: Date.now(),
            timeframe: timeframe || 24 * 60 * 60 * 1000, // Default 24h
            patterns,
            metrics,
            insights
        };
    }

    private async analyzePattern(interaction: AgentInteraction): Promise<void> {
        const pattern = this.identifyPattern(interaction);
        if (pattern) {
            const key = `${this.patternKey}${pattern.type}`;
            const existing = await this.redis.get(key);
            const patternData = existing ? JSON.parse(existing) : this.initializePattern(pattern);
            
            patternData.frequency++;
            patternData.lastSeen = Date.now();
            patternData.examples.push(this.sanitizeExample(interaction));
            if (patternData.examples.length > 5) {
                patternData.examples.shift();
            }

            await this.redis.set(key, JSON.stringify(patternData));
        }
    }

    private identifyPattern(interaction: AgentInteraction): InteractionPattern | null {
        // Pattern recognition logic
        const patterns = {
            requestResponse: (i: AgentInteraction) => 
                i.type === 'command' && i.expectedResponse,
            broadcast: (i: AgentInteraction) =>
                i.type === 'event' && i.recipients?.length > 1,
            stateSync: (i: AgentInteraction) =>
                i.type === 'stateUpdate',
            aiAssisted: (i: AgentInteraction) =>
                i.metadata?.aiModel !== undefined
        };

        for (const [type, checker] of Object.entries(patterns)) {
            if (checker(interaction)) {
                return { type, confidence: 1.0 };
            }
        }

        return null;
    }

    private async getPatterns(): Promise<PatternSummary[]> {
        const keys = await this.redis.keys(`${this.patternKey}*`);
        const patterns: PatternSummary[] = [];

        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                const pattern = JSON.parse(data);
                patterns.push({
                    type: pattern.type,
                    frequency: pattern.frequency,
                    lastSeen: pattern.lastSeen,
                    avgLatency: pattern.metrics.averageLatency,
                    successRate: pattern.metrics.successRate
                });
            }
        }

        return patterns.sort((a, b) => b.frequency - a.frequency);
    }

    private async calculateMetrics(): Promise<SystemMetrics> {
        return {
            totalInteractions: 0,
            averageLatency: 0,
            successRate: 0,
            throughput: 0,
            activeAgents: 0,
            errorRate: 0
        };
    }

    private async generateInsights(): Promise<SystemInsight[]> {
        return [
            {
                type: 'performance',
                severity: 'info',
                message: 'System operating within normal parameters',
                metrics: { latency: 150, throughput: 1000 }
            }
        ];
    }

    private initializePattern(pattern: InteractionPattern): PatternData {
        return {
            type: pattern.type,
            frequency: 0,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            metrics: {
                averageLatency: 0,
                successRate: 1.0,
                errorRates: {}
            },
            examples: []
        };
    }

    private sanitizeExample(interaction: AgentInteraction): any {
        // Remove sensitive data before storing
        const { metadata, ...safe } = interaction;
        return safe;
    }
}

interface AgentInteraction {
    type: 'command' | 'event' | 'stateUpdate';
    source: string;
    recipients?: string[];
    content: any;
    metadata?: {
        timestamp: number;
        aiModel?: string;
        latency?: number;
    };
    expectedResponse?: boolean;
}

interface InteractionPattern {
    type: string;
    confidence: number;
}

interface PatternData {
    type: string;
    frequency: number;
    firstSeen: number;
    lastSeen: number;
    metrics: {
        averageLatency: number;
        successRate: number;
        errorRates: Record<string, number>;
    };
    examples: any[];
}

interface PatternSummary {
    type: string;
    frequency: number;
    lastSeen: number;
    avgLatency: number;
    successRate: number;
}

interface SystemMetrics {
    totalInteractions: number;
    averageLatency: number;
    successRate: number;
    throughput: number;
    activeAgents: number;
    errorRate: number;
}

interface SystemInsight {
    type: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    metrics?: Record<string, number>;
}

interface InteractionAnalysis {
    timestamp: number;
    timeframe: number;
    patterns: PatternSummary[];
    metrics: SystemMetrics;
    insights: SystemInsight[];
}