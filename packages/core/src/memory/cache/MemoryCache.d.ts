export interface CacheEntry<T> {
    value: T;
    expires: number;
    hits: number;
    created: number;
}
export interface CacheStats {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    evictions: number;
    hitRatio: number;
}
export declare class MemoryCache<T = any> {
    private readonly logger;
    private readonly cache;
    private readonly maxSize;
    private readonly defaultTTL;
    private stats;
    constructor(maxSize?: number, defaultTTL?: number);
    set(key: string, value: T, ttl?: number): void;
    get(key: string): T | null;
    delete(key: string): boolean;
    clear(): void;
    has(key: string): boolean;
    keys(): string[];
    size(): number;
    getStats(): CacheStats;
    private evictLRU;
    private cleanup;
}
//# sourceMappingURL=MemoryCache.d.ts.map