export class SystemMonitor {
    constructor(redis) {
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
    async recordResponseTime(agentId, responseTimeMs) {
        const key = `${this.metricPrefixes.agent_response_time}:${agentId}`;
        await this.recordMetric(key, responseTimeMs);
    }
    async recordMessage(roomId, messageType) {
        const key = `${this.metricPrefixes.message_count}:${roomId}:${messageType}`;
        await this.recordMetric(key, 1, true);
    }
    async recordToolUsage(toolName, success) {
        const status = success ? 'success' : 'failure';
        const key = `${this.metricPrefixes.tool_usage}:${toolName}:${status}`;
        await this.recordMetric(key, 1, true);
    }
    async recordError(errorType) {
        const key = `${this.metricPrefixes.error_rate}:${errorType}`;
        await this.recordMetric(key, 1, true);
    }
    async updateAgentLoad(agentId, activeConnectionCount) {
        const key = `${this.metricPrefixes.agent_load}:${agentId}`;
        await this.recordMetric(key, activeConnectionCount);
    }
    async recordMetric(key, value, increment = false) {
        const timestamp = Math.floor(Date.now() / 1000);
        try {
            if (increment) {
                await this.redis.zadd(key, timestamp.toString(), value.toString());
            }
            else {
                await this.redis.hset(key, timestamp.toString(), value.toString());
            }
            await this.redis.expire(key, 24 * 60 * 60);
        }
        catch (error) {
            this.logger.error(`Failed to record metric: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getMetricHistory(metricType, sourceId, timeRange = 3600) {
        const key = `${this.metricPrefixes[metricType]}:${sourceId}`;
        const minTime = Math.floor((Date.now() - timeRange) / 1000);
        const history = [];
        try {
            const data = await this.redis.hgetall(key);
            for (const [timestamp, value] of Object.entries(data)) {
                const ts = parseInt(timestamp, 10);
                if (ts >= minTime) {
                    history.push({
                        timestamp: new Date(ts * 1000),
                        value: parseFloat(value),
                        source: { type: metricType, id: sourceId }
                    });
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to get metric history: ${error instanceof Error ? error.message : String(error)}`);
        }
        return history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    async getSystemMetrics() {
        const endTime = Date.now() / 1000;
        try {
            const [responseTimes, messageStats, toolStats, errorStats, loadStats] = await Promise.all([
                this.getMetricAggregation('agent_response_time', endTime),
                this.getMetricAggregation('message_count', endTime),
                this.getMetricAggregation('tool_usage', endTime),
                this.getMetricAggregation('error_rate', endTime),
                this.getMetricAggregation('agent_load', endTime)
            ]);
            return {
                responseTime: {
                    avg: responseTimes.avg,
                    max: responseTimes.max,
                    p95: responseTimes.p95
                },
                messageCount: {
                    total: messageStats.total,
                    perMinute: messageStats.rate
                },
                toolUsage: {
                    total: toolStats.total,
                    distribution: toolStats.distribution
                },
                errorRate: {
                    total: errorStats.total,
                    perMinute: errorStats.rate
                },
                agentLoad: {
                    active: loadStats.current,
                    total: loadStats.total
                }
            };
        }
        catch (error) {
            this.logger.error(`Failed to get system metrics: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async getMetricAggregation(metricType, endTime) {
        return {
            avg: 0,
            max: 0,
            p95: 0,
            total: 0,
            rate: 0,
            current: 0,
            distribution: {}
        };
    }
}
//# sourceMappingURL=monitoring.js.map