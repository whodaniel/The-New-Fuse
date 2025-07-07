"use strict";
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
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../services/redis.service");
const logging_service_1 = require("../services/logging.service");
let CacheService = class CacheService {
    redisService;
    logger;
    constructor(redisService, logger) {
        this.redisService = redisService;
        this.logger = logger;
    }
    /**
     * Set a value in the cache
     * @param key The key to store the value under
     * @param value The value to store
     * @param ttl Time to live in seconds (optional)
     */
    async set(key, value, ttl) {
        try {
            const serializedValue = JSON.stringify(value);
            if (ttl) {
                await this.redisService.getClient().set(key, serializedValue, 'EX', ttl);
            }
            else {
                await this.redisService.getClient().set(key, serializedValue);
            }
            this.logger.debug(`Cache set: ${key}`, { ttl });
        }
        catch (error) {
            this.logger.error(`Failed to set cache for key: ${key}`, error);
            throw error;
        }
    }
    /**
     * Get a value from the cache
     * @param key The key to retrieve
     * @returns The stored value or null if not found
     */
    async get(key) {
        try {
            const value = await this.redisService.getClient().get(key);
            if (!value)
                return null;
            return JSON.parse(value);
        }
        catch (error) {
            this.logger.error(`Failed to get cache for key: ${key}`, error);
            return null;
        }
    }
    /**
     * Delete a value from the cache
     * @param key The key to delete
     */
    async delete(key) {
        try {
            await this.redisService.getClient().del(key);
            this.logger.debug(`Cache deleted: ${key}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete cache for key: ${key}`, error);
            throw error;
        }
    }
    /**
     * Check if a key exists in the cache
     * @param key The key to check
     * @returns True if the key exists, false otherwise
     */
    async exists(key) {
        try {
            const result = await this.redisService.getClient().exists(key);
            return result === 1;
        }
        catch (error) {
            this.logger.error(`Failed to check existence for key: ${key}`, error);
            return false;
        }
    }
    /**
     * Set a hash field in the cache
     * @param key The hash key
     * @param field The field to set
     * @param value The value to set
     */
    async hset(key, field, value) {
        try {
            const serializedValue = JSON.stringify(value);
            await this.redisService.getClient().hset(key, field, serializedValue);
            this.logger.debug(`Cache hset: ${key}.${field}`);
        }
        catch (error) {
            this.logger.error(`Failed to set hash cache for key: ${key}.${field}`, error);
            throw error;
        }
    }
    /**
     * Get a hash field from the cache
     * @param key The hash key
     * @param field The field to get
     * @returns The stored value or null if not found
     */
    async hget(key, field) {
        try {
            const value = await this.redisService.getClient().hget(key, field);
            if (!value)
                return null;
            return JSON.parse(value);
        }
        catch (error) {
            this.logger.error(`Failed to get hash cache for key: ${key}.${field}`, error);
            return null;
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        logging_service_1.LoggingService])
], CacheService);
