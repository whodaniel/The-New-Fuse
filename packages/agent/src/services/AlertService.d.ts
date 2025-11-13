import { BaseService } from '../core/BaseService';
export interface AlertPayload {
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    source?: string;
    details?: Record<string, unknown>;
}
export interface AlertChannel {
    send(payload: AlertPayload): Promise<void>;
}
/**
 * Service responsible for handling and dispatching alerts.
 */
export declare class AlertService extends BaseService {
    private channels;
    private logger;
    constructor();
    registerChannel(channel: AlertChannel): void;
    if(payload: any, severity: any): any;
}
//# sourceMappingURL=AlertService.d.ts.map