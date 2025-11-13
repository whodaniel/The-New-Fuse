import { createClient } from 'redis';
import 'dotenv/config';

const REDIS_URL = process.env.REDIS_URL;
class RedisClient {
    static instance;
    client;
    constructor() {
        this.client = createClient({
            url: REDIS_URL
        });
        this.client.on('error', (err) => console.error('Redis Client Error:', err));
        this.client.on('connect', () => console.log('Redis Client Connected'));
    }
    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }
    async connect() {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }
    async disconnect() {
        if (this.client.isOpen) {
            await this.client.disconnect();
        }
    }
    async set(key, value) {
        await this.client.set(key, value);
    }
    async get(key) {
        return await this.client.get(key);
    }
    async delete(key) {
        return await this.client.del(key);
    }
}
export const redisClient = RedisClient.getInstance();
//# sourceMappingURL=redis.js.map