export {}
exports.ClientBridge = exports.RedisConfig = void 0;
import ioredis_1 from 'ioredis';
import uuid_1 from 'uuid';
import logging_config_1 from './logging_config.js';
import events_1 from 'events';
const logger = (0, logging_config_1.setupLogging)('redis_client');
class RedisConfig {
    constructor({ host = 'localhost', port = 6379, password, db = 0, tls = false } = {}) {
        this.host = host;
        this.port = port;
        this.password = password;
        this.db = db;
        this.tls = tls;
    }
    toConnectionOptions() {
        return {
            host: this.host,
            port: this.port,
            password: this.password,
            db: this.db,
            tls: this.tls ? {} : undefined,
            lazyConnect: true,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    return true;
                }
                return false;
            }
        };
    }
}
exports.RedisConfig = RedisConfig;
class ClientBridge extends events_1.EventEmitter {
    constructor(config, instanceId) {
        super();
        this.config = config;
        this.redis = null;
        this.subscriber = null;
        this.instanceId = instanceId || (0, uuid_1.v4)();
        this._isConnected = false;
        this._shouldRun = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.handleMessage = this.handleMessage.bind(this);
        this.handleError = this.handleError.bind(this);
    }
    get isConnected() {
        return this._isConnected;
    }
    get shouldRun() {
        return this._shouldRun;
    }
    getRedis() {
        if (!this.redis) {
            this.redis = new ioredis_1.default(this.config.toConnectionOptions());
            this.setupRedisEventHandlers(this.redis);
        }
        return this.redis;
    }
    getSubscriber() {
        if (!this.subscriber) {
            this.subscriber = new ioredis_1.default(this.config.toConnectionOptions());
            this.setupRedisEventHandlers(this.subscriber);
        }
        return this.subscriber;
    }
    setupRedisEventHandlers(client) {
        client.on('error', this.handleError);
        client.on('close', () => {
            this._isConnected = false;
            logger.warn('Redis connection closed');
            this.emit('disconnected');
        });
        client.on('reconnecting', (delay) => {
            logger.info(`Attempting to reconnect in ${delay}ms`);
        });
        client.on('ready', () => {
            this._isConnected = true;
            this.reconnectAttempts = 0;
            logger.info('Redis client ready');
            this.emit('connected');
        });
    }
    async handleError(error) {
        logger.error('Redis error:', error);
        this._isConnected = false;
        this.emit('error', error);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            logger.info(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            await this.reconnect();
        }
        else {
            logger.error('Max reconnection attempts reached');
            await this.stop();
        }
    }
    async reconnect() {
        try {
            await this.disconnect();
            await this.connect();
        }
        catch (error) {
            logger.error('Failed to reconnect:', error);
        }
    }
    async handleMessage(channel, message) {
        try {
            const parsedMessage = JSON.parse(message);
            this.emit('message', channel, parsedMessage);
        }
        catch (error) {
            logger.error('Error handling message:', error);
            this.emit('messageError', error);
        }
    }
    async connect() {
        try {
            await this.getRedis().ping();
            const subscriber = this.getSubscriber();
            subscriber.on('message', this.handleMessage);
            this._isConnected = true;
            logger.info(`Connected to Redis at ${this.config.host}:${this.config.port}`);
            return true;
        }
        catch (error) {
            logger.error('Failed to connect to Redis:', error);
            this._isConnected = false;
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.subscriber) {
                this.subscriber.removeListener('message', this.handleMessage);
                await this.subscriber.quit();
                this.subscriber = null;
            }
            if (this.redis) {
                await this.redis.quit();
                this.redis = null;
            }
            this._isConnected = false;
            logger.info('Disconnected from Redis');
        }
        catch (error) {
            logger.error('Error disconnecting from Redis:', error);
            throw error;
        }
    }
    async subscribe(channels) {
        const channelList = Array.isArray(channels) ? channels : [channels];
        try {
            await this.getSubscriber().subscribe(...channelList);
            logger.info('Subscribed to channels:', channelList);
        }
        catch (error) {
            logger.error('Error subscribing to channels:', error);
            throw error;
        }
    }
    async unsubscribe(channels) {
        const channelList = Array.isArray(channels) ? channels : [channels];
        try {
            await this.getSubscriber().unsubscribe(...channelList);
            logger.info('Unsubscribed from channels:', channelList);
        }
        catch (error) {
            logger.error('Error unsubscribing from channels:', error);
            throw error;
        }
    }
    async publish(channel, message) {
        try {
            const messageString = JSON.stringify(Object.assign(Object.assign({}, message), { timestamp: new Date().toISOString(), sender: this.instanceId }));
            const result = await this.getRedis().publish(channel, messageString);
            return result;
        }
        catch (error) {
            logger.error('Error publishing message:', error);
            throw error;
        }
    }
    async start() {
        if (!await this.connect()) {
            throw new Error('Failed to connect to Redis');
        }
        this._shouldRun = true;
        logger.info(`Bridge started with instance ID: ${this.instanceId}`);
    }
    async stop() {
        this._shouldRun = false;
        await this.disconnect();
        logger.info('Bridge stopped');
    }
}
exports.ClientBridge = ClientBridge;
if (require.main === module) {
    const run = async () => {
        const config = new RedisConfig();
        const bridge = new ClientBridge(config);
        try {
            process.on('SIGINT', async () => {
                await bridge.stop();
                process.exit(0);
            });
            await bridge.start();
            await bridge.subscribe(['test_channel']);
            bridge.on('message', (channel, message) => {
                logger.info('Received message:', { channel, message });
            });
            while (bridge.shouldRun) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        catch (error) {
            logger.error('Error running bridge:', error);
            process.exit(1);
        }
    };
    run();
}
export {};
//# sourceMappingURL=redis_client.js.map