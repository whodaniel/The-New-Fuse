export declare class MetricsService {
    getMetrics(): Promise<{
        totalUsers: number;
        totalAgents: number;
        totalWorkflows: number;
        systemHealth: string;
    }>;
    getSystemMetrics(): Promise<{
        totalUsers: number;
        totalAgents: number;
        totalWorkflows: number;
        systemHealth: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        cpu: number;
    }>;
    recordMetric(name: string, value: number): Promise<void>;
    getSystemStats(): Promise<{
        uptime: number;
        memory: NodeJS.MemoryUsage;
        cpu: number;
    }>;
}
//# sourceMappingURL=metrics.service.d.ts.map