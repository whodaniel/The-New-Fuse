import { OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConsolidatedMonitoringService } from './ConsolidatedMonitoringService.tsx';
/**
 * AgentMonitoringService
 *
 * This service provides a backward-compatible API for the agent module's MonitoringService
 * while delegating all functionality to the ConsolidatedMonitoringService.
 *
 * This allows for a gradual migration from the agent's MonitoringService to the
 * consolidated monitoring infrastructure without breaking existing code.
 */
export declare class AgentMonitoringService implements OnModuleInit {
    private readonly consolidatedMonitoring;
    private readonly eventEmitter;
    private readonly logger;
    constructor(consolidatedMonitoring: ConsolidatedMonitoringService, eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    /**
     * Log a system event
     */
    logEvent(eventType: string, data: any): void;
    /**
     * Record a metric
     */
    recordMetric(metricName: string, value: number, tags?: Record<string, string>): void;
    /**
     * Start monitoring a specific component
     */
    startMonitoring(componentName: string): void;
    /**
     * Stop monitoring a specific component
     */
    stopMonitoring(componentName: string): void;
    /**
     * Check system health
     */
    checkHealth(): Promise<Record<string, any>>;
}
//# sourceMappingURL=AgentMonitoringService.d.ts.map