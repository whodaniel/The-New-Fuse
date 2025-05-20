export interface CacheOptions {
    ttl?: number;
    maxSize?: number;
}

export class CacheManager<T> {
    private cache: Map<string, { value: T; expires: number }> = new Map();
    private readonly defaultTTL: number;
    private readonly maxSize: number;

    constructor(options: CacheOptions = {}) {
        this.defaultTTL = options.ttl || 300000; // 5 minutes default
        this.maxSize = options.maxSize || 1000;
    }

    public set(key: string, value: T, ttl?: number): void {
        this.evictExpired();
        
        if (this.cache.size >= this.maxSize) {
            const oldestKey = Array.from(this.cache.keys())[0];
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            value,
            expires: Date.now() + (ttl || this.defaultTTL)
        });
    }

    public get(key: string): T | undefined {
        const item = this.cache.get(key);
        if (!item) return undefined;

        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return undefined;
        }

        return item.value;
    }

    private evictExpired(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                this.cache.delete(key);
            }
        }
    }
}
