import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class MonitoringService {
    private readonly configService;
    private readonly eventEmitter;
    constructor(configService: ConfigService, eventEmitter: EventEmitter2);
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
//# sourceMappingURL=MonitoringService.d.ts.map