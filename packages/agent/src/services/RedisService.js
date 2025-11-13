"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const BaseService_1 = require("../core/BaseService");
const common_1 = require("@nestjs/common");
/**
 * Service for interacting with Redis via UnifiedRedisService.
 * Provides Redis commands while maintaining BaseService compatibility.
 */
class RedisService extends BaseService_1.BaseService {
    unifiedRedis;
    logger;
    constructor(configService, unifiedRedis) {
        super({ name: 'RedisService' });
        this.unifiedRedis = unifiedRedis;
        this.logger = new common_1.Logger('RedisService');
        this.logger.log('Agent Redis Service initialized with UnifiedRedisService');
    }
    /**
     * Connection is managed by UnifiedRedisService
     */
    async connect() {
        // UnifiedRedisService handles connection management
        this.logger.debug('Connection managed by UnifiedRedisService');
    }
    /**
     * Disconnection is managed by UnifiedRedisService
     */
    async disconnect() {
        // UnifiedRedisService handles connection cleanup
        this.logger.debug('Disconnection managed by UnifiedRedisService');
    }
    /**
     * Gets the UnifiedRedisService instance.
     */
    getClient() {
        return this.unifiedRedis;
    }
    // --- Redis Commands ---
    async set(key, value, expirySeconds) {
        const stringValue = typeof value === 'string' ? value : String(value);
        await this.unifiedRedis.set(key, stringValue, expirySeconds);
    }
    async get(key) {
        return this.unifiedRedis.get(key);
    }
    async del(key) {
        if (Array.isArray(key)) {
            let deleted = 0;
            for (const k of key) {
                deleted += await this.unifiedRedis.del(k);
            }
            return deleted;
        }
        return this.unifiedRedis.del(key);
    }
    async incr(key) {
        // Implement using get/set since UnifiedRedisService doesn't have incr
        const current = await this.unifiedRedis.get(key);
        const value = current ? parseInt(current, 10) + 1 : 1;
        await this.unifiedRedis.set(key, value.toString());
        return value;
    }
    async decr(key) {
        // Implement using get/set since UnifiedRedisService doesn't have decr
        const current = await this.unifiedRedis.get(key);
        const value = current ? parseInt(current, 10) - 1 : -1;
        await this.unifiedRedis.set(key, value.toString());
        return value;
    }
    async publish(channel, message) {
        const messageStr = typeof message === 'string' ? message : message.toString();
        await this.unifiedRedis.publish(channel, { message: messageStr });
    }
    async subscribe(channel, callback) {
        await this.unifiedRedis.subscribe(channel, (pubSubMessage) => {
            const messageStr = typeof pubSubMessage.message === 'string'
                ? pubSubMessage.message
                : JSON.stringify(pubSubMessage.message);
            callback(messageStr);
        });
    }
    async unsubscribe(channel) {
        await this.unifiedRedis.unsubscribe(channel);
    }
    async hset(key, fieldOrData, value) {
        if (typeof fieldOrData === 'string' && value !== undefined) {
            await this.unifiedRedis.hset(key, fieldOrData, value);
        }
        else if (typeof fieldOrData === 'object') {
            await this.unifiedRedis.hset(key, fieldOrData);
        }
    }
    async hget(key, field) {
        return this.unifiedRedis.hget(key, field);
    }
    async hgetall(key) {
        return this.unifiedRedis.hgetall(key);
    }
    async hdel(key, field) {
        return this.unifiedRedis.hdel(key, field);
    }
    // List operations
    async lpush(key, ...values) {
        return this.unifiedRedis.lpush(key, ...values);
    }
    async rpop(key) {
        return this.unifiedRedis.rpop(key);
    }
    async llen(key) {
        return this.unifiedRedis.llen(key);
    }
    async lrange(key, start, stop) {
        return this.unifiedRedis.lrange(key, start, stop);
    }
    // Set operations
    async sadd(key, ...members) {
        return this.unifiedRedis.sadd(key, ...members);
    }
    async srem(key, ...members) {
        return this.unifiedRedis.srem(key, ...members);
    }
    async smembers(key) {
        return this.unifiedRedis.smembers(key);
    }
    async sismember(key, member) {
        return this.unifiedRedis.sismember(key, member);
    }
    // Utility methods
    async exists(key) {
        return this.unifiedRedis.exists(key);
    }
    async expire(key, seconds) {
        return this.unifiedRedis.expire(key, seconds);
    }
    async keys(pattern) {
        return this.unifiedRedis.keys(pattern);
    }
    async ping() {
        return this.unifiedRedis.ping();
    }
    async flushdb() {
        await this.unifiedRedis.flushdb();
    }
    // Advanced features
    async cache(key, factory, options) {
        return this.unifiedRedis.cache(key, factory, options);
    }
    async enqueue(queueName, task, priority = 1) {
        await this.unifiedRedis.enqueue(queueName, task, priority);
    }
    async dequeue(queueName) {
        const queueTask = await this.unifiedRedis.dequeue(queueName);
        return queueTask ? queueTask.data : null;
    }
    // Health and monitoring
    async getHealth() {
        return this.unifiedRedis.getHealth();
    }
    getMetrics() {
        return this.unifiedRedis.getMetrics();
    }
}
exports.RedisService = RedisService;
//# sourceMappingURL=RedisService.js.map