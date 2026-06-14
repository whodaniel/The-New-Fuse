export declare class ApiCoreService {
    constructor();
    initialize(): Promise<void>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
    getVersion(): Promise<{
        version: string;
    }>;
}
//# sourceMappingURL=api-core.service.d.ts.map