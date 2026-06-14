export interface PerformanceMetrics {
    averageResponseTime: number;
    requestCount: number;
    throughput: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    successRate: number;
}
export interface RequestRecord {
    timestamp: Date;
    responseTime: number;
    success: boolean;
    endpoint?: string;
    method?: string;
    statusCode?: number;
}
export declare class PerformanceAnalytics {
    private metrics;
    private readonly maxStoredMetrics;
    recordRequest(responseTime: number, success: boolean, endpoint?: string, method?: string, statusCode?: number): void;
    getMetrics(timeWindowMinutes?: number): PerformanceMetrics;
    getEndpointMetrics(endpoint: string, timeWindowMinutes?: number): PerformanceMetrics;
    getSlowRequests(thresholdMs: number, hours?: number): RequestRecord[];
    getTopEndpoints(limit?: number, timeWindowMinutes?: number): Array<{
        endpoint: string;
        count: number;
    }>;
    clearOldMetrics(olderThanHours?: number): void;
    getTotalRequestCount(): number;
}
//# sourceMappingURL=PerformanceAnalytics.d.ts.map