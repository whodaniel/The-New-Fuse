import { Redis } from 'ioredis';

class RedisService {
    private client: Redis;
    private subscribers: Map<string, any>;

    constructor(config: { host: string; port: number; password: string; db?: number }) {
        this.client = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            db: config.db || 0,
        });
        this.subscribers = new Map();
    }

    async connect(): Promise<void> {
        // Connection is handled in constructor
        return Promise.resolve();
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async getAll(pattern: string): Promise<string[]> {
        const keys = await this.client.keys(pattern);
        if (keys.length === 0)
            return [];
        const values = await this.client.mget(...keys);
        return values.filter((value) => value !== null) as string[];
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.client.set(key, value, 'EX', ttl);
        }
        else {
            await this.client.set(key, value);
        }
    }

    async setWorkflowState(workflowId: string, state: any): Promise<void> {
        await this.set(`workflow:${workflowId}:state`, JSON.stringify(state));
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(key);
        return result === 1;
    }

    async keys(pattern: string): Promise<string[]> {
        return this.client.keys(pattern);
    }

    async publish(channel: string, message: string): Promise<void> {
        await this.client.publish(channel, message);
    }

    async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
        const subscriber = new Redis({
            host: this.client.options.host,
            port: this.client.options.port,
            password: this.client.options.password,
            db: this.client.options.db,
        });
        await subscriber.subscribe(channel);
        subscriber.on('message', (ch, message) => {
            if (ch === channel) {
                callback(message);
            }
        });
        this.subscribers.set(channel, callback);
    }

    async unsubscribe(channel: string): Promise<void> {
        const subscriber = this.subscribers.get(channel);
        if (subscriber) {
            await this.client.unsubscribe(channel);
            this.subscribers.delete(channel);
        }
    }

    async disconnect(): Promise<void> {
        for (const [channel] of this.subscribers) {
            await this.unsubscribe(channel);
        }
        await this.client.quit();
    }
}

export { RedisService };
