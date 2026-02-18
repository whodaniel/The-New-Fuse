"use strict";
/**
 * Redis Service
 *
 * This module provides a high-level interface for Redis operations,
 * abstracting away the details of the Redis client implementation.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_1 = require("./logger");
const redis_client_js_1 = require("./redis-client.js");
/**
 * Redis Service class
 */
let RedisService = class RedisService {
    configService;
    client = null;
    isConnected = false;
    constructor(configService) {
        this.configService = configService;
        logger_1.redisServiceLogger.debug('Creating RedisService instance');
    }
    async onModuleInit() {
        await this.initialize();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    /**
     * Initialize the Redis service
     * @param configOrEnv Redis configuration or environment
     */
    async initialize(configOrEnv) {
        if (this.isConnected) {
            logger_1.redisServiceLogger.debug('Redis service already initialized');
            return;
        }
        logger_1.redisServiceLogger.info('Initializing Redis service');
        try {
            this.client = await (0, redis_client_js_1.createRedisClient)(configOrEnv);
            this.isConnected = true;
            logger_1.redisServiceLogger.info('Redis service initialized successfully');
        }
        catch (error) {
            logger_1.redisServiceLogger.error('Failed to initialize Redis service', { error });
            throw error;
        }
    }
    /**
     * Get the Redis client
     */
    getClient() {
        this.ensureConnected();
        return this.client;
    }
    /**
     * Close the Redis connection
     */
    async disconnect() {
        if (this.client) {
            try {
                await this.client.quit();
                this.client = null;
                this.isConnected = false;
                logger_1.redisServiceLogger.info('Disconnected from Redis');
            }
            catch (error) {
                logger_1.redisServiceLogger.error('Error disconnecting from Redis', { error });
                throw error;
            }
        }
    }
    /**
     * Ensure the Redis client is connected
     */
    ensureConnected() {
        if (!this.isConnected || !this.client) {
            throw new Error('Redis service not initialized. Call initialize() first.');
        }
    }
    // Basic key-value operations
    /**
     * Set a key-value pair
     * @param key The key
     * @param value The value
     * @param ttl Time to live in seconds (optional)
     */
    async set(key, value, ttl) {
        this.ensureConnected();
        try {
            if (ttl) {
                return await this.client.set(key, value, 'EX', ttl);
            }
            return await this.client.set(key, value);
        }
        catch (error) {
            logger_1.redisServiceLogger.error('Error setting key in Redis', { key, error });
            throw error;
        }
    }
    /**
     * Get a value by key
     * @param key The key
     */
    async get(key) {
        this.ensureConnected();
        try {
            return await this.client.get(key);
        }
        catch (error) {
            logger_1.redisServiceLogger.error('Error getting key from Redis', { key, error });
            throw error;
        }
    }
    /**
     * Delete a key
     * @param key The key
     */
    async del(key) {
        this.ensureConnected();
        try {
            return await this.client.del(key);
        }
        catch (error) {
            logger_1.redisServiceLogger.error('Error deleting key from Redis', { key, error });
            throw error;
        }
    }
    /**
     * Check if a key exists
     * @param key The key
     */
    async exists(key) {
        this.ensureConnected();
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            logger_1.redisServiceLogger.error('Error checking key existence in Redis', { key, error });
            throw error;
        }
    }
    /**
     * Get keys by pattern
     * @param pattern The pattern
     */
    async keys(pattern) {
        this.ensureConnected();
        try {
            return await this.client.keys(pattern);
        }
        catch (error) {
            logger_1.redisServiceLogger.error('Error getting keys from Redis', { pattern, error });
            throw error;
        }
    }
    /**
     * Ping the Redis server
     */
    async ping() {
        this.ensureConnected();
        try {
            return await this.client.ping();
        }
        catch (error) {
            logger_1.redisServiceLogger.error('Error pinging Redis', { error });
            throw error;
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis-service.js.map