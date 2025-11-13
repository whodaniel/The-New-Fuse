var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UnifiedRedisService_1;
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisConfig } from './RedisConfig';
let UnifiedRedisService = UnifiedRedisService_1 = class UnifiedRedisService {
    redisConfig;
    logger = new Logger(UnifiedRedisService_1.name);
    mainClient;
    pubSubClient;
    subscribers = new Map();
    patternSubscribers = new Map();
    metrics = {
        operations: {
            get: 0, set: 0, del: 0, hget: 0, hset: 0,
            lpush: 0, rpop: 0, publish: 0
        },
        performance: {
            avgLatency: 0, maxLatency: 0, errorRate: 0
        },
        memory: {
            used: 0, peak: 0, fragmentation: 0
        },
        connections: {
            active: 0, total: 0, rejected: 0
        }
    };
    operationLogs = [];
    MAX_LOG_SIZE = 1000;
    constructor(redisConfig) {
        this.redisConfig = redisConfig;
    }
    async onModuleInit() {
        await this.initializeConnections();
        this.logger.log('Unified Redis Service initialized');
    }
    async onModuleDestroy() {
        await this.closeAllConnections();
        this.logger.log('Unified Redis Service destroyed');
    }
    async initializeConnections() {
        const config = this.redisConfig.getConnectionOptions();
        try {
            if (this.redisConfig.isClusterMode()) {
                const nodes = this.redisConfig.getClusterNodes();
                this.mainClient = new Redis.Cluster(nodes, {
                    redisOptions: config,
                    ...this.redisConfig.getConfiguration().cluster
                });
                this.pubSubClient = new Redis.Cluster(nodes, {
                    redisOptions: config,
                    ...this.redisConfig.getConfiguration().cluster
                });
            }
            else {
                this.mainClient = new Redis(config);
                this.pubSubClient = new Redis(config);
            }
            this.setupEventHandlers();
            await this.mainClient.ping();
            await this.pubSubClient.ping();
            this.logger.log('Redis connections established successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize Redis connections', error);
            throw error;
        }
    }
    setupEventHandlers() {
        this.mainClient.on('connect', () => {
            this.logger.log('Main Redis client connected');
            this.metrics.connections.active++;
        });
        this.mainClient.on('error', (err) => {
            this.logger.error('Main Redis client error', err);
            this.metrics.performance.errorRate++;
        });
        this.pubSubClient.on('connect', () => {
            this.logger.log('PubSub Redis client connected');
        });
        this.pubSubClient.on('error', (err) => {
            this.logger.error('PubSub Redis client error', err);
        });
    }
    async executeOperation(operation, key, executor) {
        const startTime = Date.now();
        try {
            const result = await executor();
            const duration = Date.now() - startTime;
            this.logOperation(operation, key, duration, true);
            this.updateMetrics(operation, duration);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.logOperation(operation, key, duration, false, error instanceof Error ? error.message : String(error));
            this.metrics.performance.errorRate++;
            throw error;
        }
    }
    logOperation(operation, key, duration, success, error) {
        const log = {
            operation,
            key,
            duration,
            success,
            error,
            timestamp: new Date()
        };
        this.operationLogs.push(log);
        if (this.operationLogs.length > this.MAX_LOG_SIZE) {
            this.operationLogs = this.operationLogs.slice(-this.MAX_LOG_SIZE);
        }
    }
    updateMetrics(operation, duration) {
        if (operation in this.metrics.operations) {
            this.metrics.operations[operation]++;
        }
        this.metrics.performance.maxLatency = Math.max(this.metrics.performance.maxLatency, duration);
        const totalOps = Object.values(this.metrics.operations).reduce((sum, count) => sum + count, 0);
        this.metrics.performance.avgLatency = totalOps > 0
            ? (this.metrics.performance.avgLatency * (totalOps - 1) + duration) / totalOps
            : duration;
    }
    // Core Redis Operations
    async get(key) {
        return this.executeOperation('get', key, () => this.mainClient.get(key));
    }
    async set(key, value, ttl) {
        await this.executeOperation('set', key, async () => {
            if (ttl) {
                await this.mainClient.set(key, value, 'EX', ttl);
            }
            else {
                await this.mainClient.set(key, value);
            }
        });
    }
    async del(key) {
        return this.executeOperation('del', key, () => this.mainClient.del(key));
    }
    async exists(key) {
        return this.executeOperation('exists', key, async () => {
            const result = await this.mainClient.exists(key);
            return result === 1;
        });
    }
    async expire(key, ttl) {
        return this.executeOperation('expire', key, async () => {
            const result = await this.mainClient.expire(key, ttl);
            return result === 1;
        });
    }
    async hset(key, fieldOrData, value) {
        await this.executeOperation('hset', key, async () => {
            if (typeof fieldOrData === 'string' && value !== undefined) {
                await this.mainClient.hset(key, fieldOrData, value);
            }
            else if (typeof fieldOrData === 'object') {
                await this.mainClient.hset(key, fieldOrData);
            }
            else {
                throw new Error('Invalid arguments for hset');
            }
        });
    }
    async hget(key, field) {
        return this.executeOperation('hget', key, () => this.mainClient.hget(key, field));
    }
    async hgetall(key) {
        return this.executeOperation('hgetall', key, () => this.mainClient.hgetall(key));
    }
    async hdel(key, field) {
        return this.executeOperation('hdel', key, () => this.mainClient.hdel(key, field));
    }
    // List Operations
    async lpush(key, ...values) {
        return this.executeOperation('lpush', key, () => this.mainClient.lpush(key, ...values));
    }
    async rpop(key) {
        return this.executeOperation('rpop', key, () => this.mainClient.rpop(key));
    }
    async llen(key) {
        return this.executeOperation('llen', key, () => this.mainClient.llen(key));
    }
    async lrange(key, start, stop) {
        return this.executeOperation('lrange', key, () => this.mainClient.lrange(key, start, stop));
    }
    // Sorted Set Operations (for queue implementation)
    async zadd(key, score, member) {
        return this.executeOperation('zadd', key, () => this.mainClient.zadd(key, score, member));
    }
    async zpopmax(key) {
        return this.executeOperation('zpopmax', key, () => this.mainClient.zpopmax(key));
    }
    async zrange(key, start, stop) {
        return this.executeOperation('zrange', key, () => this.mainClient.zrange(key, start, stop));
    }
    async zrem(key, member) {
        return this.executeOperation('zrem', key, () => this.mainClient.zrem(key, member));
    }
    // Set operations
    async sadd(key, ...members) {
        return this.executeOperation('sadd', key, async () => {
            return await this.mainClient.sadd(key, ...members);
        });
    }
    async srem(key, ...members) {
        return this.executeOperation('srem', key, async () => {
            return await this.mainClient.srem(key, ...members);
        });
    }
    async smembers(key) {
        return this.executeOperation('smembers', key, async () => {
            return await this.mainClient.smembers(key);
        });
    }
    async sismember(key, member) {
        return this.executeOperation('sismember', key, async () => {
            return (await this.mainClient.sismember(key, member)) === 1;
        });
    }
    // List operations (additional)
    async ltrim(key, start, stop) {
        await this.executeOperation('ltrim', key, async () => {
            await this.mainClient.ltrim(key, start, stop);
        });
    }
    async lindex(key, index) {
        return this.executeOperation('lindex', key, async () => {
            return await this.mainClient.lindex(key, index);
        });
    }
    // Pub/Sub Operations
    async publish(channel, message) {
        return this.executeOperation('publish', channel, () => {
            const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
            return this.mainClient.publish(channel, messageStr);
        });
    }
    async subscribe(channel, callback) {
        return this.executeOperation('subscribe', channel, async () => {
            if (this.subscribers.has(channel)) {
                this.logger.warn(`Already subscribed to channel: ${channel}`);
                return;
            }
            const subscriber = this.pubSubClient instanceof Redis.Cluster
                ? new Redis.Cluster(this.redisConfig.getClusterNodes(), {
                    redisOptions: this.redisConfig.getConnectionOptions()
                })
                : new Redis(this.redisConfig.getConnectionOptions());
            await subscriber.subscribe(channel);
            subscriber.on('message', (ch, message) => {
                if (ch === channel) {
                    callback({
                        channel: ch,
                        message,
                        timestamp: new Date()
                    });
                }
            });
            this.subscribers.set(channel, subscriber);
            this.logger.log(`Subscribed to channel: ${channel}`);
        });
    }
    async psubscribe(pattern, callback) {
        return this.executeOperation('psubscribe', pattern, async () => {
            if (this.patternSubscribers.has(pattern)) {
                this.logger.warn(`Already psubscribed to pattern: ${pattern}`);
                return;
            }
            const subscriber = this.pubSubClient instanceof Redis.Cluster
                ? new Redis.Cluster(this.redisConfig.getClusterNodes(), {
                    redisOptions: this.redisConfig.getConnectionOptions()
                })
                : new Redis(this.redisConfig.getConnectionOptions());
            await subscriber.psubscribe(pattern);
            subscriber.on('pmessage', (p, ch, message) => {
                if (p === pattern) {
                    callback({
                        channel: ch,
                        pattern: p,
                        message,
                        timestamp: new Date()
                    });
                }
            });
            this.patternSubscribers.set(pattern, subscriber);
            this.logger.log(`Psubscribed to pattern: ${pattern}`);
        });
    }
    async unsubscribe(channel) {
        return this.executeOperation('unsubscribe', channel, async () => {
            const subscriber = this.subscribers.get(channel);
            if (subscriber) {
                await subscriber.unsubscribe(channel);
                await subscriber.quit();
                this.subscribers.delete(channel);
                this.logger.log(`Unsubscribed from channel: ${channel}`);
            }
        });
    }
    async punsubscribe(pattern) {
        return this.executeOperation('punsubscribe', pattern, async () => {
            const subscriber = this.patternSubscribers.get(pattern);
            if (subscriber) {
                await subscriber.punsubscribe(pattern);
                await subscriber.quit();
                this.patternSubscribers.delete(pattern);
                this.logger.log(`Punsubscribed from pattern: ${pattern}`);
            }
        });
    }
    // Extended Operations (from api/redis.service.ts)
    async getAll(pattern) {
        return this.executeOperation('keys', pattern, async () => {
            const keys = await this.mainClient.keys(pattern);
            if (keys.length === 0)
                return [];
            const values = await this.mainClient.mget(...keys);
            return values.filter((value) => value !== null);
        });
    }
    async setWorkflowState(workflowId, state) {
        const key = `workflow:${workflowId}:state`;
        return this.set(key, JSON.stringify(state));
    }
    async getWorkflowState(workflowId) {
        const key = `workflow:${workflowId}:state`;
        const state = await this.get(key);
        return state ? JSON.parse(state) : null;
    }
    // Queue Operations (rewritten from queue.service.ts)
    async enqueue(queueName, task, priority = 1) {
        const taskData = {
            ...task,
            createdAt: new Date(),
            retryCount: task.retryCount || 0,
            maxRetries: task.maxRetries || 3,
        };
        const taskStr = JSON.stringify(taskData);
        await this.zadd(queueName, priority, taskStr);
    }
    async dequeue(queueName) {
        const result = await this.zpopmax(queueName);
        if (result.length === 0)
            return null;
        const taskStr = result[0];
        return JSON.parse(taskStr);
    }
    async requeueWithBackoff(queueName, task, retryPenalty = 2) {
        const newPriority = (task.priority || 1) * Math.pow(retryPenalty, task.retryCount || 0);
        const updatedTask = {
            ...task,
            retryCount: (task.retryCount || 0) + 1
        };
        await this.enqueue(queueName, updatedTask, newPriority);
    }
    // Vector Operations (for vector database integration)
    async vectorSet(key, vector, metadata) {
        const data = {
            vector,
            metadata: metadata || {},
            timestamp: new Date().toISOString()
        };
        await this.set(key, JSON.stringify(data));
    }
    async vectorGet(key) {
        const data = await this.get(key);
        return data ? JSON.parse(data) : null;
    }
    async vectorSearch(searchVector, limit = 10) {
        const pattern = 'vector:*';
        const keys = await this.mainClient.keys(pattern);
        const results = [];
        for (const key of keys.slice(0, limit)) {
            const data = await this.vectorGet(key);
            if (data) {
                const similarity = this.calculateCosineSimilarity(searchVector, data.vector);
                results.push({
                    id: key,
                    score: similarity,
                    vector: data.vector,
                    metadata: data.metadata
                });
            }
        }
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }
    calculateCosineSimilarity(a, b) {
        if (a.length !== b.length)
            return 0;
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        if (magnitudeA === 0 || magnitudeB === 0)
            return 0;
        return dotProduct / (magnitudeA * magnitudeB);
    }
    // Caching Layer (high-level abstraction)
    async cache(key, factory, options = {}) {
        const cacheKey = options.namespace ? `${options.namespace}:${key}` : key;
        const cached = await this.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const result = await factory();
        const serialized = JSON.stringify(result);
        if (options.ttl) {
            await this.set(cacheKey, serialized, options.ttl);
        }
        else {
            await this.set(cacheKey, serialized);
        }
        if (options.tags) {
            for (const tag of options.tags) {
                await this.lpush(`cache:tags:${tag}`, cacheKey);
            }
        }
        return result;
    }
    async invalidateByTag(tag) {
        const tagKey = `cache:tags:${tag}`;
        const keys = await this.lrange(tagKey, 0, -1);
        if (keys.length > 0) {
            await Promise.all(keys.map(key => this.del(key)));
            await this.del(tagKey);
        }
    }
    // Utility Methods
    async ping() {
        return this.executeOperation('ping', undefined, () => this.mainClient.ping());
    }
    async flushdb() {
        await this.executeOperation('flushdb', undefined, async () => {
            await this.mainClient.flushdb();
            this.logger.log('Redis database flushed');
        });
    }
    async keys(pattern) {
        return this.executeOperation('keys', pattern, () => this.mainClient.keys(pattern));
    }
    // Health and Monitoring
    async getHealth() {
        try {
            const startTime = Date.now();
            await this.ping();
            const latency = Date.now() - startTime;
            const info = await this.mainClient.info();
            const lines = info.split('\r\n');
            let memoryUsage = 0;
            let connectedClients = 0;
            let uptime = 0;
            for (const line of lines) {
                if (line.startsWith('used_memory:')) {
                    memoryUsage = parseInt(line.split(':')[1]);
                }
                else if (line.startsWith('connected_clients:')) {
                    connectedClients = parseInt(line.split(':')[1]);
                }
                else if (line.startsWith('uptime_in_seconds:')) {
                    uptime = parseInt(line.split(':')[1]);
                }
            }
            return {
                status: 'healthy',
                latency,
                memoryUsage,
                connectedClients,
                uptime
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                latency: -1,
                memoryUsage: 0,
                connectedClients: 0,
                uptime: 0,
                lastError: error instanceof Error ? error.message : String(error)
            };
        }
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getOperationLogs(limit = 100) {
        return this.operationLogs.slice(-limit);
    }
    async closeAllConnections() {
        try {
            for (const subscriber of this.subscribers.values()) {
                await subscriber.quit();
            }
            this.subscribers.clear();
            for (const patternSubscriber of this.patternSubscribers.values()) {
                await patternSubscriber.quit();
            }
            this.patternSubscribers.clear();
            await this.mainClient.quit();
            await this.pubSubClient.quit();
            this.logger.log('All Redis connections closed');
        }
        catch (error) {
            this.logger.error('Error closing Redis connections', error);
        }
    }
};
UnifiedRedisService = UnifiedRedisService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [RedisConfig])
], UnifiedRedisService);
export { UnifiedRedisService };
//# sourceMappingURL=UnifiedRedisService.js.map