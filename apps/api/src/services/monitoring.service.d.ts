import { SystemMonitor, MetricsCollector, PerformanceMonitor } from '@the-new-fuse/core';
import { AgentService } from './agent.service.js';
export declare class MonitoringService {
    private readonly systemMonitor;
    private readonly metricsCollector;
    private readonly performanceMonitor;
    private readonly agentService;
    constructor(systemMonitor: SystemMonitor, metricsCollector: MetricsCollector, performanceMonitor: PerformanceMonitor, agentService: AgentService);
    getHealth(): Promise<any>;
    getMetrics(): Promise<any>;
    getAgentStatus(): Promise<any>;
    getPerformance(): Promise<any>;
    getErrors(): Promise<any>;
    getResources(): Promise<any>;
    private checkDatabaseHealth;
}
