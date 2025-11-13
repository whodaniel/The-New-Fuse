import { LoggingService } from '../services/LoggingService';
import { ConfigService } from '../config/ConfigService';
export interface AuditEvent {
    actor: {
        id: string;
        type: 'user' | 'agent' | 'system';
    };
    action: string;
    resource: {
        id: string;
        type: string;
    };
    timestamp: Date;
    details?: Record<string, any>;
    status: 'success' | 'failure';
}
export declare class AuditService {
    private readonly logger;
    private readonly configService;
    constructor(logger: LoggingService, configService: ConfigService);
    /**
     * Logs an audit event.
     * @param event The audit event to log.
     */
    logEvent(event: Omit<AuditEvent, 'timestamp'>): void;
    handleUserCreatedEvent(payload: any): void;
    handleUserLoginEvent(payload: any): void;
    handleAgentStartedEvent(payload: any): void;
    handleAgentStoppedEvent(payload: any): void;
}
export default AuditService;
//# sourceMappingURL=AuditService.d.ts.map