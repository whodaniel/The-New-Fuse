interface CacheOptions {
    ttl?: number;
    namespace?: string;
}
export declare class CacheService {
    private readonly redis;
    private readonly logger;
    private readonly defaultTTL;
    constructor(redisUrl?: string);
    private getKey;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
    get<T>(key: string, namespace?: string): Promise<T | null>;
    delete(key: string, namespace?: string): Promise<void>;
    has(key: string, namespace?: string): Promise<boolean>;
    clear(namespace?: string): Promise<void>;
    getMultiple<T>(keys: string[], namespace?: string): Promise<(T | null)[]>;
    setMultiple<T>(entries: {
        key: string;
        value: T;
    }[], options?: CacheOptions): Promise<void>;
    close(): Promise<void>;
}
export {};
