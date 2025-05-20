
var __importDefault = (this && this.__importDefault) || function (mod): any {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
export {}
exports.RedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
import logging_1 from '../logging.js';
class RedisClient {
    constructor() {
        this.reconnectAttempts = 0;
        this.MAX_RECONNECT_ATTEMPTS = 5;
        this.RECONNECT_DELAY = 1000;
        this.connectionPool = [];
        this.POOL_SIZE = 5;
        this.subscribers = new Map();
        this.client = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                if (times > this.MAX_RECONNECT_ATTEMPTS) {
                    return null;
                }
                return Math.min(times * this.RECONNECT_DELAY, 5000);
            },
            maxRetriesPerRequest: 3,
        });
        this.initializeConnectionPool();
    }
    async initializeConnectionPool(): Promise<void> {) {
        for (let i = 0; i < this.POOL_SIZE; i++) {
            const client = new ioredis_1.default({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
                retryStrategy: (times) => {
                    if (times > this.MAX_RECONNECT_ATTEMPTS) {
                        return null;
                    }
                    return Math.min(times * this.RECONNECT_DELAY, 5000);
                },
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                autoResendUnfulfilledCommands: true,
            });
            client.on('error', (error) => {
                logging_1.logger.error('Redis client error:', error);
                this.handleConnectionError(client);
            });
            client.on('ready', () => {
                logging_1.logger.info('Redis client ready');
                this.reconnectAttempts = 0;
            });
            this.connectionPool.push(client);
        }
        this.client = this.connectionPool[0];
    }
    handleConnectionError(client) {
        this.reconnectAttempts++;
        if (this.reconnectAttempts <= this.MAX_RECONNECT_ATTEMPTS) {
            setTimeout(() => {
                logging_1.logger.info(`Attempting to reconnect... (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
                client.connect();
            }, this.RECONNECT_DELAY * this.reconnectAttempts);
        }
        else {
            logging_1.logger.error('Max reconnection attempts reached');
        }
    }
    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }
    getNextAvailableClient() {
        const availableClients = this.connectionPool.filter(client => client.status === 'ready');
        if (availableClients.length === 0) {
            throw new Error('No available Redis clients');
        }
        return availableClients[Math.floor(Math.random() * availableClients.length)];
    }
    async get(): Promise<void> {key) {
        try {
            const client = this.getNextAvailableClient();
            return await client.get(key);
        }
        catch (error) {
            logging_1.logger.error('Error getting key from Redis:', error);
            throw error;
        }
    }
    async set(): Promise<void> {key, value, expireSeconds) {
        try {
            const client = this.getNextAvailableClient();
            if (expireSeconds) {
                await client.set(key, value, 'EX', expireSeconds);
            }
            else {
                await client.set(key, value);
            }
        }
        catch (error) {
            logging_1.logger.error('Error setting key in Redis:', error);
            throw error;
        }
    }
    async subscribe(): Promise<void> {channel, callback) {
        if (!this.subscribers.has(channel)) {
            this.subscribers.set(channel, new Set());
            await this.client.subscribe(channel);
        }
        this.subscribers.get(channel)?.add(callback);
        this.client.on('message', (receivedChannel, message) => {
            if (receivedChannel === channel) {
                this.subscribers.get(channel)?.forEach(cb => cb(message));
            }
        });
    }
    async unsubscribe(): Promise<void> {channel, callback) {
        const channelSubscribers = this.subscribers.get(channel);
        if (channelSubscribers) {
            channelSubscribers.delete(callback);
            if (channelSubscribers.size === 0) {
                await this.client.unsubscribe(channel);
                this.subscribers.delete(channel);
            }
        }
    }
    async disconnect(): Promise<void> {) {
        await Promise.all(this.connectionPool.map(client => client.quit()));
        this.connectionPool = [];
    }
}
exports.RedisClient = RedisClient;
exports.default = RedisClient;
//# sourceMappingURL=index.js.mapexport {};
