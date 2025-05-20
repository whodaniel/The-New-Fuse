
export {}
exports.RedisClient = void 0;
import ioredis_1 from 'ioredis';
import events_1 from 'events';
class RedisClient extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.isConnected = false;
        this.client = new ioredis_1.Redis({
            host: options.host || 'localhost',
            port: options.port || 6379,
            password: options.password,
            db: options.db || 0,
            keyPrefix: options.keyPrefix,
            retryStrategy: options.retryStrategy,
            maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
            lazyConnect: true,
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            this.isConnected = true;
            this.emit('connect');
        });
        this.client.on('error', (error) => {
            this.emit('error', error);
        });
        this.client.on('close', () => {
            this.isConnected = false;
            this.emit('close');
        });
    }
    async connect(): Promise<void> {) {
        if (!this.isConnected) {
            await this.client.connect();
        }
    }
    async disconnect(): Promise<void> {) {
        if (this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }
    async get(): Promise<void> {key) {
        return await this.client.get(key);
    }
    async set(): Promise<void> {key, value, ttl) {
        if (ttl) {
            return await this.client.set(key, value, 'EX', ttl);
        }
        return await this.client.set(key, value);
    }
    async del(): Promise<void> {key) {
        return await this.client.del(key);
    }
    async exists(): Promise<void> {key) {
        return await this.client.exists(key);
    }
    async publish(): Promise<void> {channel, message) {
        return await this.client.publish(channel, message);
    }
    async subscribe(): Promise<void> {channel, callback) {
        await this.client.subscribe(channel);
        this.client.on('message', (ch, message) => {
            if (ch === channel) {
                callback(message);
            }
        });
    }
    async unsubscribe(): Promise<void> {channel) {
        await this.client.unsubscribe(channel);
    }
    getStatus() {
        return this.isConnected;
    }
    getClient() {
        return this.client;
    }
}
exports.RedisClient = RedisClient;
//# sourceMappingURL=RedisClient.js.mapexport {};
