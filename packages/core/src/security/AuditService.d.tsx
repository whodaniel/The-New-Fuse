export interface AuditConfig {
    retention: number;
    sensitiveFields: string[];
    storageType: database' | 'file';
}
export declare class AuditService {
    private config;
    constructor(config: AuditConfig);
    logAuditEvent(): Promise<void>;
}
