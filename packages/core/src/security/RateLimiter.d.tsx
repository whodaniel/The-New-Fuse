export declare class RateLimiter {
    private readonly redis;
    private readonly config;
    constructor(redis: Redis, config: RateLimitConfigType);
    private getKey;
    isRateLimited(): Promise<void>;
}
