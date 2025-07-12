import { ConfigService } from '@nestjs/config';
export interface CacheOptions {
    ttl?: number;
    compress?: boolean;
    tags?: string[];
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    memory: number;
    keys: number;
}
export declare class RedisCacheService {
    private configService;
    private readonly logger;
    private redis;
    private stats;
    private readonly cacheConfigs;
    constructor(configService: ConfigService);
    private initializeRedis;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    invalidateByTag(tag: string): Promise<number>;
    cacheAgent(agentId: string, agentData: any): Promise<boolean>;
    getAgent(agentId: string): Promise<any | null>;
    cacheWorkflow(workflowId: string, workflowData: any): Promise<boolean>;
    getWorkflow(workflowId: string): Promise<any | null>;
    cacheTask(taskId: string, taskData: any): Promise<boolean>;
    getTask(taskId: string): Promise<any | null>;
    cacheUser(userId: string, userData: any): Promise<boolean>;
    getUser(userId: string): Promise<any | null>;
    cacheDashboardData(userId: string, dashboardData: any): Promise<boolean>;
    getDashboardData(userId: string): Promise<any | null>;
    cacheSearchResults(searchKey: string, results: any): Promise<boolean>;
    getSearchResults(searchKey: string): Promise<any | null>;
    cacheAnalytics(analyticsKey: string, analyticsData: any): Promise<boolean>;
    getAnalytics(analyticsKey: string): Promise<any | null>;
    cacheSession(sessionId: string, sessionData: any): Promise<boolean>;
    getSession(sessionId: string): Promise<any | null>;
    batchGet<T>(keys: string[]): Promise<Array<T | null>>;
    batchSet<T>(items: Array<{
        key: string;
        value: T;
        options?: CacheOptions;
    }>): Promise<boolean[]>;
    warmCache(userId: string): Promise<void>;
    getStats(): Promise<CacheStats & {
        hitRate: number;
        memoryUsage: string;
    }>;
    healthCheck(): Promise<{
        status: string;
        latency: number;
    }>;
    private hashKey;
    private formatBytes;
    onModuleDestroy(): Promise<void>;
}
export declare function Cacheable(options: CacheOptions & {
    key: string;
}): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
//# sourceMappingURL=redis-cache.service.d.ts.map