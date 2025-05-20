import Redis from 'ioredis';

class RedisConnection {
    private static instance: Redis;
    private static isReady: boolean = false;

    static async initialize() {
        try {
            this.instance = new Redis({
                host: 'localhost',
                port: 6379,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });

            this.instance.on('connect', () => {
                console.log('Redis client connected');
            });

            this.instance.on('ready', () => {
                console.log('Redis client ready');
                this.isReady = true;
            });

            this.instance.on('error', (err) => {
                console.error('Redis client error:', err);
                this.isReady = false;
            });

            return this.instance;
        } catch (error) {
            console.error('Failed to initialize Redis connection:', error);
            throw error;
        }
    }

    static getInstance(): Redis {
        if (!this.instance) {
            throw new Error('Redis connection not initialized');
        }
        return this.instance;
    }

    static isConnected(): boolean {
        return this.isReady;
    }
}

export default RedisConnection;
