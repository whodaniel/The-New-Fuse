import { RedisCore } from '../redis_core/redis_client.js';
import { Logger } from './logger.js';

interface MetricPoint {
    timestamp: Date;
    value: number;
    labels: Record<string, string>;
}

interface SystemHealth {
    response_times: {
        avg: number;
        max: number;
    };
    error_rate: Record<string, number>;
    message_volume: number;
    active_agents: Record<string, number>;
}

export class SystemMonitor {
    private readonly redis: RedisCore;
    private readonly logger: Logger;
    private readonly metricPrefixes: Record<string, string>;

    constructor(redis: RedisCore) {
        this.redis = redis;
        this.logger = new Logger('SystemMonitor');
        this.metricPrefixes = {
            agent_response_time: 'monitor:response_time',
            message_count: 'monitor:msg_count',
            tool_usage: 'monitor:tool_usage',
            error_rate: 'monitor:errors',
            agent_load: 'monitor:agent_load'
        };
    }

    public async recordResponseTime(agentId: string, responseTimeMs: number): Promise<void> {
        const key = `${this.metricPrefixes.agent_response_time}:${agentId}`;
        await this.storeMetric(key, responseTimeMs);
    }

    public async recordMessage(roomId: string, messageType: string): Promise<void> {
        const key = `${this.metricPrefixes.message_count}:${roomId}:${messageType}`;
        await this.storeMetric(key, 1, true);
    }

    public async recordToolUsage(toolName: string, success: boolean): Promise<void> {
        const status = success ? 'success' : 'failure';
        const key = `${this.metricPrefixes.tool_usage}:${toolName}:${status}`;
        await this.storeMetric(key, 1, true);
    }

    public async recordError(errorType: string): Promise<void> {
        const key = `${this.metricPrefixes.error_rate}:${errorType}`;
        await this.storeMetric(key, 1, true);
    }

    public async updateAgentLoad(agentId: string, activeConnectionCount: number): Promise<void> {
        const key = `${this.metricPrefixes.agent_load}:${agentId}`;
        await this.storeMetric(key, activeConnectionCount);
    }

    private async storeMetric(key: string, value: number, increment = false): Promise<void> {
        const timestamp = Math.floor(Date.now() / 1000);
        try {
            if (increment) {
                await this.redis.hincrby(key, timestamp.toString(), value);
            } else {
                await this.redis.hset(key, timestamp.toString(), value.toString());
            }
            await this.redis.expire(key, 7 * 24 * 60 * 60); // Expire after 7 days
        } catch (error) {
            this.logger.error(`Failed to store metric: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async getMetricHistory(metricType: string, identifier: string, timeWindow = 3600): Promise<MetricPoint[]> {
        const key = `${this.metricPrefixes[metricType]}:${identifier}`;
        const startTime = Math.floor((Date.now() / 1000) - timeWindow);

        try {
            const data = await this.redis.hgetall(key);
            const metrics: MetricPoint[] = [];

            for (const [ts, value] of Object.entries(data)) {
                if (parseInt(ts, 10) >= startTime) {
                    metrics.push({
                        timestamp: new Date(parseInt(ts, 10) * 1000),
                        value: parseFloat(value),
                        labels: { type: metricType, id: identifier }
                    });
                }
            }

            return metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        } catch (error) {
            this.logger.error(`Failed to get metric history: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }

    public async getSystemHealth(): Promise<SystemHealth> {
        const hourAgo = Math.floor(Date.now() / 1000) - 3600;

        try {
            return {
                response_times: {
                    avg: await this.getAverageMetric('agent_response_time', hourAgo),
                    max: await this.getMaxMetric('agent_response_time', hourAgo)
                },
                error_rate: await this.getErrorMetrics(hourAgo),
                message_volume: await this.getMessageVolume(hourAgo),
                active_agents: await this.getActiveAgents(hourAgo)
            };
        } catch (error) {
            this.logger.error(`Failed to get system health: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    private async getAverageMetric(metricType: string, since: number): Promise<number> {
        const pattern = `${this.metricPrefixes[metricType]}:*`;
        try {
            const keys = await this.redis.keys(pattern);
            if (!keys.length) return 0;

            let sum = 0;
            let count = 0;

            for (const key of keys) {
                const data = await this.redis.hgetall(key);
                for (const [timestamp, value] of Object.entries(data)) {
                    if (parseInt(timestamp, 10) >= since) {
                        sum += parseFloat(value);
                        count++;
                    }
                }
            }

            return count > 0 ? sum / count : 0;
        } catch (error) {
            this.logger.error(`Failed to calculate average metric: ${error instanceof Error ? error.message : String(error)}`);
            return 0;
        }
    }

    private async getMaxMetric(metricType: string, since: number): Promise<number> {
        const pattern = `${this.metricPrefixes[metricType]}:*`;
        try {
            const keys = await this.redis.keys(pattern);
            if (!keys.length) return 0;

            let max = Number.MIN_SAFE_INTEGER;

            for (const key of keys) {
                const data = await this.redis.hgetall(key);
                for (const [timestamp, value] of Object.entries(data)) {
                    if (parseInt(timestamp, 10) >= since) {
                        max = Math.max(max, parseFloat(value));
                    }
                }
            }

            return max === Number.MIN_SAFE_INTEGER ? 0 : max;
        } catch (error) {
            this.logger.error(`Failed to calculate max metric: ${error instanceof Error ? error.message : String(error)}`);
            return 0;
        }
    }

    private async getErrorMetrics(since: number): Promise<Record<string, number>> {
        const pattern = `${this.metricPrefixes.error_rate}:*`;
        try {
            const keys = await this.redis.keys(pattern);
            const errorCounts: Record<string, number> = {};

            for (const key of keys) {
                const errorType = key.split(':').pop() || 'unknown';
                const data = await this.redis.hgetall(key);
                
                errorCounts[errorType] = Object.entries(data)
                    .filter(([timestamp]) => parseInt(timestamp, 10) >= since)
                    .reduce((sum, [_, value]) => sum + parseInt(value, 10), 0);
            }

            return errorCounts;
        } catch (error) {
            this.logger.error(`Failed to get error metrics: ${error instanceof Error ? error.message : String(error)}`);
            return {};
        }
    }

    private async getMessageVolume(since: number): Promise<number> {
        const pattern = `${this.metricPrefixes.message_count}:*`;
        try {
            const keys = await this.redis.keys(pattern);
            let totalMessages = 0;

            for (const key of keys) {
                const data = await this.redis.hgetall(key);
                totalMessages += Object.entries(data)
                    .filter(([timestamp]) => parseInt(timestamp, 10) >= since)
                    .reduce((sum, [_, value]) => sum + parseInt(value, 10), 0);
            }

            return totalMessages;
        } catch (error) {
            this.logger.error(`Failed to get message volume: ${error instanceof Error ? error.message : String(error)}`);
            return 0;
        }
    }

    private async getActiveAgents(since: number): Promise<Record<string, number>> {
        const pattern = `${this.metricPrefixes.agent_load}:*`;
        try {
            const keys = await this.redis.keys(pattern);
            const agentLoads: Record<string, number> = {};

            for (const key of keys) {
                const agentId = key.split(':').pop() || 'unknown';
                const data = await this.redis.hgetall(key);
                
                // Get the most recent load value for each agent
                const recentEntries = Object.entries(data)
                    .filter(([timestamp]) => parseInt(timestamp, 10) >= since)
                    .sort(([a], [b]) => parseInt(b, 10) - parseInt(a, 10));

                if (recentEntries.length > 0) {
                    agentLoads[agentId] = parseInt(recentEntries[0][1], 10);
                }
            }

            return agentLoads;
        } catch (error) {
            this.logger.error(`Failed to get active agents: ${error instanceof Error ? error.message : String(error)}`);
            return {};
        }
    }
}