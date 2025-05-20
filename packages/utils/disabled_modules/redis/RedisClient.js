"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
}
() => ;
() => {
    if (!this.isConnected) {
        await this.client.connect();
    }
};
async;
disconnect();
Promise();
Promise();
{
    if (this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
    }
}
async;
get();
Promise();
Promise(key);
{
    return await this.client.get(key);
}
async;
set();
Promise();
Promise(key, value, ttl);
{
    if (ttl) {
        return await this.client.set(key, value, 'EX', ttl);
    }
    return await this.client.set(key, value);
}
async;
del();
Promise();
Promise(key);
{
    return await this.client.del(key);
}
async;
exists();
Promise();
Promise(key);
{
    return await this.client.exists(key);
}
async;
publish();
Promise();
Promise(channel, message);
{
    return await this.client.publish(channel, message);
}
async;
subscribe();
Promise();
Promise(channel, callback);
{
    await this.client.subscribe(channel);
    this.client.on('message', (ch, message) => {
        if (ch === channel) {
            callback(message);
        }
    });
}
async;
unsubscribe();
Promise();
Promise(channel);
{
    await this.client.unsubscribe(channel);
}
getStatus();
{
    return this.isConnected;
}
getClient();
{
    return this.client;
}
exports.RedisClient = RedisClient;
export {};
//# sourceMappingURL=RedisClient.js.map