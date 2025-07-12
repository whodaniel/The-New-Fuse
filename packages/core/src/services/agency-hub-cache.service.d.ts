export declare class AgencyHubCacheService {
    private cache;
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    del(key: string): Promise<boolean>;
    clear(): Promise<void>;
    keys(pattern?: string): Promise<string[]>;
    exists(key: string): Promise<boolean>;
}
//# sourceMappingURL=agency-hub-cache.service.d.ts.map