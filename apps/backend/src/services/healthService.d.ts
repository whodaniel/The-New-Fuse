export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    services: Record<string, ServiceHealth>;
    system: SystemHealth;
    uptime: number;
}
export interface ServiceHealth {
    status: 'up' | 'down' | 'degraded';
    responseTime?: number;
    lastCheck: Date;
    error?: string;
}
export interface SystemHealth {
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    cpu: {
        usage: number;
    };
    disk: {
        used: number;
        total: number;
        percentage: number;
    };
}
export declare class HealthService {
    private services;
    getHealthStatus(): Promise<HealthStatus>;
    checkService(name: string, healthCheckFn: () => Promise<boolean>): Promise<ServiceHealth>;
    private getAllServiceHealth;
    private getSystemHealth;
    private calculateOverallStatus;
}
//# sourceMappingURL=healthService.d.ts.map