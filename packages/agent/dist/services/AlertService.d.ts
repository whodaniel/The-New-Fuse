import { BaseService } from '../core/BaseService';
export interface AlertPayload {
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    source?: string;
    details?: Record<string, unknown>;
}
export interface Alert extends AlertPayload {
    id: string;
    timestamp: Date;
}
export interface AlertChannel {
    send(alert: Alert): Promise<void>;
}
export declare class AlertService extends BaseService {
    private channels;
    private logger;
    constructor();
    registerChannel(channel: AlertChannel): void;
    dispatchAlert(payload: AlertPayload): Promise<void>;
    info(message: string, source?: string, details?: Record<string, unknown>): Promise<void>;
    warn(message: string, source?: string, details?: Record<string, unknown>): Promise<void>;
    error(message: string, source?: string, details?: Record<string, unknown>): Promise<void>;
    critical(message: string, source?: string, details?: Record<string, unknown>): Promise<void>;
}
export declare class ConsoleAlertChannel implements AlertChannel {
    private readonly logger;
    send(alert: Alert): Promise<void>;
}
//# sourceMappingURL=AlertService.d.ts.map