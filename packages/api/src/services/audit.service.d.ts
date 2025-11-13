export interface AuditEvent {
    action: string;
    userId: string;
    timestamp?: Date;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AuditService {
    private readonly logger;
    logEvent(event: AuditEvent): Promise<void>;
}
//# sourceMappingURL=audit.service.d.ts.map