"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConfig = exports.DatabaseConfig = void 0;
exports.initDb = initDb;
exports.getDb = getDb;
import redis_1 from 'redis';
import pg_1 from 'pg';
import logging_config_1 from './logging_config.js';
import events_1 from 'events';
const logger = (0, logging_config_1.setupLogging)('database');
class DatabaseConfig extends events_1.EventEmitter {
    constructor() {
        super();
        this.shardMap = {};
        this.redisClient = null;
        this.metrics = {
            connections: {},
            queries: {},
            errors: {},
            latency: {}
        };
        this.defaultPoolSize = Number(process.env.DB_POOL_SIZE || 20);
        this.defaultMaxOverflow = Number(process.env.DB_MAX_OVERFLOW || 10);
        this.defaultPoolTimeout = Number(process.env.DB_POOL_TIMEOUT || 30);
        this.defaultPoolRecycle = Number(process.env.DB_POOL_RECYCLE || 3600);
        this.initializeRedis();
    }
    async initializeRedis() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.redisClient = (0, redis_1.createClient)({
                url: redisUrl,
                socket: {
                    timeout: Number(process.env.REDIS_SOCKET_TIMEOUT || 5000),
                    reconnectStrategy: (retries) => {
                        if (retries > 10)
                            return new Error('Max reconnection attempts reached');
                        return Math.min(retries * 100, 3000);
                    }
                }
            });
            await this.redisClient.connect();
            logger.info('Redis connection initialized successfully');
        }
        catch (err) {
            logger.error('Failed to initialize Redis:', err);
            this.redisClient = null;
        }
    }
    async initShards(shardConfigs) {
        for (const [shardName, config] of Object.entries(shardConfigs)) {
            await this.addShard(shardName, config);
        }
    }
    async addShard(shardName, config) {
        var _a;
        try {
            const pool = new pg_1.Pool({
                connectionString: config.uri,
                max: config.poolSize || this.defaultPoolSize,
                idleTimeoutMillis: (config.poolTimeout || this.defaultPoolTimeout) * 1000,
                connectionTimeoutMillis: 5000
            });
            this.metrics.connections[shardName] = 0;
            this.metrics.queries[shardName] = 0;
            this.metrics.errors[shardName] = 0;
            this.metrics.latency[shardName] = [];
            pool.on('connect', () => {
                var _a;
                this.metrics.connections[shardName]++;
                (_a = this.redisClient) === null || _a === void 0 ? void 0 : _a.hIncrBy(`db:metrics:${shardName}`, 'connections', 1);
                logger.debug(`Connection created on shard ${shardName}`);
            });
            pool.on('remove', () => {
                var _a;
                this.metrics.connections[shardName]--;
                (_a = this.redisClient) === null || _a === void 0 ? void 0 : _a.hIncrBy(`db:metrics:${shardName}`, 'connections', -1);
                logger.debug(`Connection removed from shard ${shardName}`);
            });
            pool.on('error', (err) => {
                var _a;
                this.metrics.errors[shardName]++;
                (_a = this.redisClient) === null || _a === void 0 ? void 0 : _a.hIncrBy(`db:metrics:${shardName}`, 'errors', 1);
                logger.error(`Database error on shard ${shardName}:`, err);
            });
            this.shardMap[shardName] = {
                uri: config.uri,
                config,
                pool
            };
            logger.info(`Successfully added shard: ${shardName}`);
        }
        catch (err) {
            this.metrics.errors[shardName] = (this.metrics.errors[shardName] || 0) + 1;
            (_a = this.redisClient) === null || _a === void 0 ? void 0 : _a.hIncrBy(`db:metrics:${shardName}`, 'errors', 1);
            logger.error(`Failed to add shard ${shardName}:`, err);
            throw err;
        }
    }
    async getClient(shardName) {
        const shard = this.getShardInfo(shardName);
        const startTime = Date.now();
        try {
            const client = await shard.pool.connect();
            const duration = (Date.now() - startTime) / 1000;
            this.metrics.latency[shardName || 'default'].push(duration);
            this.metrics.queries[shardName || 'default']++;
            if (this.redisClient) {
                await Promise.all([
                    this.redisClient.hIncrBy(`db:metrics:${shardName}`, 'queries', 1),
                    this.redisClient.lPush(`db:latency:${shardName}`, duration.toString()),
                    this.redisClient.lTrim(`db:latency:${shardName}`, 0, 999)
                ]);
            }
            return client;
        }
        catch (err) {
            this.metrics.errors[shardName || 'default']++;
            if (this.redisClient) {
                await this.redisClient.hIncrBy(`db:metrics:${shardName}`, 'errors', 1);
            }
            throw err;
        }
    }
    async getHealthStatus() {
        const status = {};
        for (const [shardName, shard] of Object.entries(this.shardMap)) {
            try {
                const client = await shard.pool.connect();
                await client.query('SELECT 1');
                client.release();
                const latencyArray = this.metrics.latency[shardName] || [0];
                const avgLatency = latencyArray.reduce((a, b) => a + b, 0) / latencyArray.length;
                status[shardName] = {
                    status: 'healthy',
                    metrics: {
                        connections: this.metrics.connections[shardName] || 0,
                        queries: this.metrics.queries[shardName] || 0,
                        errors: this.metrics.errors[shardName] || 0,
                        avgLatency
                    }
                };
            }
            catch (err) {
                status[shardName] = {
                    status: 'unhealthy',
                    error: err instanceof Error ? err.message : String(err)
                };
            }
        }
        return status;
    }
    getMetrics() {
        return this.metrics;
    }
    getShardInfo(shardName) {
        if (!shardName) {
            shardName = Object.keys(this.shardMap)[0];
        }
        const shard = this.shardMap[shardName];
        if (!shard) {
            throw new Error(`Unknown shard: ${shardName}`);
        }
        return shard;
    }
    async dispose() {
        var _a;
        await Promise.all([
            ...Object.values(this.shardMap).map(shard => shard.pool.end()),
            (_a = this.redisClient) === null || _a === void 0 ? void 0 : _a.quit()
        ]);
    }
}
exports.DatabaseConfig = DatabaseConfig;
exports.dbConfig = new DatabaseConfig();
async function initDb() {
    const shardConfigs = {
        default: {
            uri: process.env.DATABASE_URL || 'postgres://localhost:5432/dashboard',
            poolSize: 20,
            maxOverflow: 10
        },
        analytics: {
            uri: process.env.ANALYTICS_DATABASE_URL || 'postgres://localhost:5432/analytics',
            poolSize: 10,
            maxOverflow: 5
        }
    };
    await exports.dbConfig.initShards(shardConfigs);
    logger.info('Database configuration initialized successfully');
}
function getDb() {
    return exports.dbConfig;
}
//# sourceMappingURL=database.js.map