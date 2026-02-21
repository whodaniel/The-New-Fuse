import { Injectable } from '@nestjs/common';
import { RedisClient } from './RedisClient.js';

@Injectable()
export class A2ARateLimiter {
    private readonly windowSize = 60; // 1 minute
    private readonly maxRequests = 1000;

    constructor(private redis: RedisClient) {}

    async checkLimit(agentId: string): Promise<boolean> {
        const key = `ratelimit:${agentId}`;
        const currentTime = Math.floor(Date.now() / 1000);
        const windowStart = currentTime - this.windowSize;

        await this.redis.zremrangebyscore(key, 0, windowStart);
        const requestCount = await this.redis.zcard(key);

        if (requestCount >= this.maxRequests) {
            return false;
        }

        await this.redis.zadd(key, currentTime, `${currentTime}-${Math.random()}`);
        await this.redis.expire(key, this.windowSize);
        return true;
    }

    async resetLimit(agentId: string): Promise<void> {
        const key = `ratelimit:${agentId}`;
        await this.redis.del(key);
    }
}