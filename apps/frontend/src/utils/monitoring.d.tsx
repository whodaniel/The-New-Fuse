interface RedisClient {
    zadd: (key: string, score: string, value: string) => Promise<void>;
    hset: (key: string, field: string, value: string) => Promise<void>;
    hgetall: (key: string) => Promise<Record<string, string>>;
    expire: (key: string, seconds: number) => Promise<void>;
}
interface MetricDataPoint {
    timestamp: Date;
    value: number;
    source: {
        type: string;
        id: string;
    };
}
interface SystemMetrics {
    responseTime: {
        avg: number;
        max: number;
        p95: number;
    };
    messageCount: {
        total: number;
        perMinute: number;
    };
    toolUsage: {
        total: number;
        distribution: Record<string, number>;
    };
    errorRate: {
        total: number;
        perMinute: number;
    };
    agentLoad: {
        active: number;
        total: number;
    };
}
export declare class SystemMonitor {
    private metricPrefixes;
    private redis;
    private logger;
    constructor(redis: RedisClient);
    recordResponseTime(agentId: string, responseTimeMs: number): Promise<void>;
    recordMessage(roomId: string, messageType: string): Promise<void>;
    recordToolUsage(toolName: string, success: boolean): Promise<void>;
    recordError(errorType: string): Promise<void>;
    updateAgentLoad(agentId: string, activeConnectionCount: number): Promise<void>;
    private recordMetric;
    getMetricHistory(metricType: string, sourceId: string, timeRange?: number): Promise<MetricDataPoint[]>;
    getSystemMetrics(): Promise<SystemMetrics>;
    private getMetricAggregation;
}
export {};
