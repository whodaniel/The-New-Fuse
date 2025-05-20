import { RedisManager } from '../redis/redisManager.js';
export declare class RateLimiter {
    private readonly windowMs;
    private readonly maxRequests;
    private readonly cache;
    private readonly redis?;
    constructor(windowMs?: number, maxRequests?: number, redis?: RedisManager);
}
