import { EventEmitter2 } from '@nestjs/event-emitter';
export interface SecurityAlert {
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export declare class SystemMonitor {
    private eventEmitter;
    constructor(eventEmitter: EventEmitter2);
    getSystemHealth(): Promise<any>;
    getSecurityAlerts(): Promise<SecurityAlert[]>;
    createAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp'>): Promise<SecurityAlert>;
    startMonitoring(): Promise<void>;
    stopMonitoring(): Promise<void>;
    getMetrics(): Promise<any>;
}
//# sourceMappingURL=SystemMonitor.d.ts.map