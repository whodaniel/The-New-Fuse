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
    private readonly logger;
    constructor(eventEmitter: EventEmitter2);
    getSystemHealth(): Promise<any>;
    getSecurityAlerts(): Promise<any[]>;
    createAlert(alert: Partial<SecurityAlert>): Promise<SecurityAlert>;
}
//# sourceMappingURL=SystemMonitor.d.ts.map