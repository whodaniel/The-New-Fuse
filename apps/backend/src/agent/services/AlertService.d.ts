import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class AlertService {
    private readonly configService;
    private readonly eventEmitter;
    constructor(configService: ConfigService, eventEmitter: EventEmitter2);
    /**
     * Send a system alert
     */
    sendAlert(alertType: string, message: string, severity?: 'info' | 'warning' | 'error' | 'critical', metadata?: Record<string, any>): void;
    /**
     * Send an info level alert
     */
    info(alertType: string, message: string, metadata?: Record<string, any>): void;
    /**
     * Send a warning level alert
     */
    warning(alertType: string, message: string, metadata?: Record<string, any>): void;
    /**
     * Send an error level alert
     */
    error(alertType: string, message: string, metadata?: Record<string, any>): void;
    /**
     * Send a critical level alert
     */
    critical(alertType: string, message: string, metadata?: Record<string, any>): void;
    /**
     * Check if alerts should be sent based on environment
     */
    shouldSendAlerts(): boolean;
}
