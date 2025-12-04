export declare class SystemMonitor {
    constructor(redis: any);
    recordResponseTime(agentId: any, responseTimeMs: any): Promise<void>;
    recordMessage(roomId: any, messageType: any): Promise<void>;
    recordToolUsage(toolName: any, success: any): Promise<void>;
    recordError(errorType: any): Promise<void>;
    updateAgentLoad(agentId: any, activeConnectionCount: any): Promise<void>;
    recordMetric(key: any, value: any, increment?: boolean): Promise<void>;
    getMetricHistory(metricType: any, sourceId: any, timeRange?: number): Promise<{
        timestamp: Date;
        value: number;
        source: {
            type: any;
            id: any;
        };
    }[]>;
    getSystemMetrics(): Promise<{
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
            distribution: {};
        };
        errorRate: {
            total: number;
            perMinute: number;
        };
        agentLoad: {
            active: number;
            total: number;
        };
    }>;
    getMetricAggregation(metricType: any, endTime: any): Promise<{
        avg: number;
        max: number;
        p95: number;
        total: number;
        rate: number;
        current: number;
        distribution: {};
    }>;
}
