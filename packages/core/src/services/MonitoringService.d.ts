import { EventEmitter2 } from '@nestjs/event-emitter';
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    issues: Array<{
        type: string;
        description: string;
        severity: 'low' | 'medium' | 'high';
    }>;
}
export declare class MonitoringService {
    private eventEmitter;
    private readonly logger;
    private healthStatus;
    constructor(eventEmitter: EventEmitter2);
    getSystemHealth(): Promise<HealthStatus>;
    getAgentHealth(agentId: string): Promise<HealthStatus>;
    recordMetric(metric: string, value: number, agentId?: string): Promise<void>;
    getMetrics(agentId?: string, timeRange?: {
        start: Date;
        end: Date;
    }): Promise<any>;
    detectAnomalies(agentId: string): Promise<any>;
    generateReport(timeRange: {
        start: Date;
        end: Date;
    }): Promise<any>;
    updateHealthStatus(agentId: string, status: HealthStatus['status']): Promise<void>;
    startMonitoring(): Promise<void>;
    stopMonitoring(): Promise<void>;
}
//# sourceMappingURL=MonitoringService.d.ts.map