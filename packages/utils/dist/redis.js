import { createStandaloneRedisClient, createUpstashRestClient } from '@the-new-fuse/infrastructure';
import { Redis } from 'ioredis';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
class RedisClient {
    constructor() {
        this.client = null;
        this.upstash = null;
    }
    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }
    async connect() {
        if (!this.client && !this.upstash) {
            this.client = createStandaloneRedisClient({ lazyConnect: true });
            this.upstash = createUpstashRestClient();
            if (this.client instanceof Redis) {
                this.client.on('error', (err) => console.error('Redis Client Error:', err));
                await this.client.connect().catch(() => { });
            }
        }
    }
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
        }
        this.upstash = null;
    }
    async set(key, value) {
        await this.connect();
        if (this.upstash) {
            await this.upstash.set(key, value);
        }
        else if (this.client) {
            await this.client.set(key, value);
        }
    }
    async get(key) {
        await this.connect();
        if (this.upstash) {
            return await this.upstash.get(key);
        }
        if (this.client) {
            return await this.client.get(key);
        }
        return null;
    }
    async delete(key) {
        await this.connect();
        if (this.upstash) {
            return await this.upstash.del(key);
        }
        if (this.client) {
            return await this.client.del(key);
        }
        return 0;
    }
}
export const redisClient = RedisClient.getInstance();
//# sourceMappingURL=redis.js.map