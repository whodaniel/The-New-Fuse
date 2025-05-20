import { RedisClientType, createClient } from 'redis';

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    tls?: boolean;
}

export class UnifiedBridge {
    private redisClient: RedisClientType | null = null;

    constructor(private config: RedisConfig) {}

    async initializeRedisClient(): Promise<void> {
        const { host, port, password, db, tls } = this.config;
        const protocol = tls ? 'rediss' : 'redis';
        let url = `${protocol}://`;
        if (password) {
            url += `:${password}@`;
        }
        url += `${host}:${port}`;

        if (this.redisClient && this.redisClient.isOpen) {
            await this.redisClient.quit();
        }

        this.redisClient = createClient({
            url,
            database: db,
        });

        this.redisClient.on('error', (err) => console.error('Redis Client Error', err));

        try {
            await this.redisClient.connect();
            console.log('Successfully connected to Redis');
        } catch (err) {
            console.error('Could not connect to Redis:', err);
            this.redisClient = null; // Reset client on connection failure
        }
    }

    getClient(): RedisClientType {
        if (!this.redisClient || !this.redisClient.isOpen) {
            throw new Error('Redis client not initialized or not connected. Call initializeRedisClient() first.');
        }
        return this.redisClient;
    }

    async disconnect(): Promise<void> {
        if (this.redisClient && this.redisClient.isOpen) {
            await this.redisClient.quit();
            this.redisClient = null;
            console.log('Successfully disconnected from Redis');
        }
    }
}
