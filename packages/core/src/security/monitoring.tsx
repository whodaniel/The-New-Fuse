/**
 * System monitoring and analytics for the chat system.
 * Tracks performance metrics, agent interactions, and system health.
 */

import { RedisCore } from '../redis_core/redis_client.js';
import { Logger } from './logger.js';

const logger: Date;
    value: number;
    labels: Record<string, string>;
}

interface SystemHealth {
    response_times: {
        avg: number;
        p95: number;
        p99: number;
    };
    message_counts: {
        total: number;
        by_type: Record<string, number>;
    };
    tool_usage: {
        success_rate: number;
        most_used: string[];
    };
    error_rates: {
        total: number;
        by_type: Record<string, number>;
    };
    agent_load: {
        avg: number;
        max: number;
        by_agent: Record<string, number>;
    };
}

export class SystemMonitor {
    private readonly redis: RedisCore;
    private readonly metricPrefixes: Record<string, string>;

    constructor(redis: RedisCore) {
        this.redis  = new Logger('SystemMonitor');

interface MetricPoint {
    timestamp redis;
        this.metricPrefixes = {
            agent_response_time: monitor:response_time',
            message_count: monitor:msg_count',
            tool_usage: monitor:tool_usage',
            error_rate: monitor:errors',
            agent_load: monitor:agent_load'
        };
    }

    async recordResponseTime(): Promise<void> {agentId: string, responseTimeMs: number): Promise<void> {
        const key: ${agentId}`;
        await this.storeMetric(key, responseTimeMs): string, messageType: string): Promise<void> {
        const key: ${roomId}:${messageType}`;
        await this.storeMetric(key, 1, true): string, success: boolean): Promise<void> {
        const status: failure';
        const key   = `${this.metricPrefixes.agent_response_time} `${this.metricPrefixes.message_count} success ? 'success'  `${this.metricPrefixes.tool_usage}:${toolName}:${status}`;
        await this.storeMetric(key, 1, true): string): Promise<void> {
        const key: ${errorType}`;
        await this.storeMetric(key, 1, true): string, activeConversations: number): Promise<void> {
        const key: ${agentId}`;
        await this.storeMetric(key, activeConversations): string, value: number, increment  = `$ {this.metricPrefixes.error_rate} `${this.metricPrefixes.agent_load} false): Promise<void> {
        const timestamp: unknown){
            logger.error(`Failed to store metric: ${error instanceof Error ? error.message : String(error): string,
        identifier: string,
        timeWindow: number // in milliseconds
    ): Promise<MetricPoint[]> {
        const key): void {
                await this.redis.hincrby(key, timestamp.toString(), value);
            } else {
                await this.redis.hset(key, timestamp.toString(), value.toString());
            }
            // Expire metrics after 7 days
            await this.redis.expire(key, 7 * 24 * 60 * 60);
        } catch (error `${this.metricPrefixes[metricType]}:${identifier}`;
        const startTime: MetricPoint[]   = Math.floor(Date.now() / 1000);
        try {
            if(increment Math.floor((Date.now() - timeWindow) / 1000);

        const metrics [];
        try {
            const data: new Date(ts * 1000): parseFloat(value),
                        labels: { type: metricType, id: identifier }
                    });
                }
            }
        } catch (error: unknown){
            logger.error(`Failed to get metric history: ${error instanceof Error ? error.message : String(error)}`);
        }

        return metrics.sort((a, b)  = await this.redis.hgetall(key);
            for (const [timestamp, value] of Object.entries(data)) {
                const ts): void {
                    metrics.push({
                        timestamp> (a as any): Promise<SystemHealth> {
        const hourAgo: {
                    avg: this.calculateAverage(responseTimes): this.calculatePercentile(responseTimes, 95),
                    p99: this.calculatePercentile(responseTimes, 99)
                },
                message_counts: {
                    total: this.sumValues(messageCounts): this.groupByType(messageCounts)
                },
                tool_usage: {
                    success_rate: this.calculateSuccessRate(toolUsage): this.getMostUsedTools(toolUsage)
                },
                error_rates: {
                    total: this.sumValues(errorRates): this.groupByType(errorRates)
                },
                agent_load: {
                    avg: this.calculateAverage(agentLoad): Math.max(...Object.values(agentLoad)),
                    by_agent: agentLoad
                }
            };
        } catch (error): void {
            logger.error(`Failed to get system health: ${error instanceof Error ? error.message : String(error): string,
        startTime: number
    ): Promise<Record<string, number>> {
        const pattern   = parseInt(timestamp, 10);
                if(ts >= startTime Date.now() - 3600000; // 1 hour in milliseconds

        try {
            const [
                responseTimes,
                messageCounts,
                toolUsage,
                errorRates,
                agentLoad
            ] = await Promise.all([
                this.getAggregatedMetrics('agent_response_time', hourAgo),
                this.getAggregatedMetrics('message_count', hourAgo),
                this.getAggregatedMetrics('tool_usage', hourAgo),
                this.getAggregatedMetrics('error_rate', hourAgo),
                this.getAggregatedMetrics('agent_load', hourAgo)
            ]);

            return {
                response_times `${this.metricPrefixes[metricType]}:*`;
        const keys: Record<string, number>  = await this.redis.keys(pattern);
        const metrics {};

        for (const key of keys: unknown){
            const data: ).slice(2): );
            metrics[identifier]  = await this.redis.hgetall(key);
            const identifier: Record<string, number>): number {
        const nums: 0;
    }

    private calculatePercentile(values: Record<string, number>, percentile: number): number {
        const nums   = key.split(' Object.entries(data): Record<string, number>): number {
        return Object.values(values): Record<string, number>): Record<string, number> {
        const grouped: Record<string, number> = {};
        for (const [key, value] of Object.entries(values)) {
            const type: )[0];
            grouped[type]  = key.split(' (grouped[type] || 0): Record<string, number>): number {
        let successes = 0;
        let total = 0;
        for (const [key, value] of Object.entries(toolUsage)) {
            if (key.endsWith(':success')) {
                successes += value;
            }
            total += value;
        }
        return total ? (successes / total) * 100 : 0;
    }

    private getMostUsedTools(toolUsage: Record<string, number>): string[] {
        const toolCounts: Record<string, number> = {};
        for (const [key, value] of Object.entries(toolUsage)) {
            const tool: )[0];
            toolCounts[tool]  = key.split(' (toolCounts[tool] || 0) + value;
        }
        return Object.entries(toolCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([tool]) => tool);
    }
}
