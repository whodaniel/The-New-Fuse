export declare class MetricsService {
    /**
     * Get basic platform metrics
     */
    getMetrics(): Promise<{
        totalUsers: number;
        totalAgents: number;
        totalWorkflows: number;
        systemHealth: "healthy" | "critical" | "degraded";
    }>;
    /**
     * Get comprehensive system metrics
     */
    getSystemMetrics(): Promise<{
        totalUsers: number;
        activeUsers: number;
        totalAgents: number;
        activeAgents: number;
        totalWorkflows: number;
        systemHealth: "healthy" | "critical" | "degraded";
        uptime: number;
        memory: {
            used: number;
            total: number;
            free: number;
            percentage: number;
        };
        cpu: {
            usage: number;
            loadAverage: {
                '1min': number;
                '5min': number;
                '15min': number;
            };
            cores: number;
        };
        platform: {
            type: NodeJS.Platform;
            release: string;
            arch: NodeJS.Architecture;
            hostname: string;
        };
        timestamp: Date;
    }>;
    /**
     * Record a custom metric
     */
    recordMetric(name: string, value: number, metadata?: any): Promise<void>;
    /**
     * Get system statistics
     */
    getSystemStats(): Promise<{
        uptime: number;
        memory: {
            heapUsed: number;
            heapTotal: number;
            rss: number;
            external: number;
            percentage: number;
        };
        cpu: {
            usage: number;
            loadAverage: number[];
        };
    }>;
    /**
     * Get CPU usage percentage
     */
    private getCPUUsage;
    /**
     * Get memory usage percentage
     */
    private getMemoryUsage;
    /**
     * Get system health status
     */
    private getHealthStatus;
    /**
     * Get count of active users (logged in within last 24 hours)
     */
    private getActiveUserCount;
    /**
     * Get count of active agents
     */
    private getActiveAgentCount;
}
//# sourceMappingURL=metrics.service.d.ts.map