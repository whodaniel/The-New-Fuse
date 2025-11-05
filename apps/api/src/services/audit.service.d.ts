export declare class AuditService {
    log(action: string, data: any): Promise<void>;
    getLogs(): Promise<{
        id: string;
        action: string;
        timestamp: Date;
        data: {};
    }[]>;
    findAll(): Promise<never[]>;
    findById(_id: string): Promise<null>;
}
//# sourceMappingURL=audit.service.d.ts.map