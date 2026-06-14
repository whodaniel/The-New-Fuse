import { EventEmitter2 } from '@nestjs/event-emitter';
export interface MonitoringEvent {
    type: string;
    timestamp: Date;
    data: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
        database: boolean;
        cache: boolean;
        external_apis: boolean;
        memory: boolean;
        cpu: boolean;
    };
    timestamp: Date;
}
export declare class MonitoringService {
    private eventEmitter;
    private readonly logger;
    private events;
    private readonly maxEvents;
    constructor(eventEmitter: EventEmitter2);
    recordEvent(type: string, data: any, severity?: MonitoringEvent['severity']): void;
    getEvents(type?: string, limit?: number): MonitoringEvent[];
    getSystemHealth(): Promise<SystemHealth>;
    private checkDatabase;
    private checkCache;
    private checkExternalAPIs;
    private checkMemory;
    private checkCPU;
    getEventsSummary(): {
        total: number;
        bySeverity: Record<string, number>;
        byType: Record<string, number>;
    };
    clearEvents(olderThan?: Date): void;
}
//# sourceMappingURL=MonitoringService.d.ts.map