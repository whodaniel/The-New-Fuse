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
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const common_2 = require("@nestjs/common");
let CacheService = CacheService_1 = class CacheService {
    redis;
    logger;
    defaultTTL = 3600; // 1 hour
    constructor(redisUrl = process.env.REDIS_URL || 'redis://localhost:6379') {
        this.redis = new ioredis_1.Redis(redisUrl);
        this.logger = new common_2.Logger(CacheService_1.name);
        this.redis.on('error', (error) => {
            this.logger.error(`Redis cache error: ${error.message}`);
        });
    }
    getKey(key, namespace) {
        return namespace ? `${namespace}:${key}` : key;
    }
    async set(key, value, options = {}) {
        try {
            const finalKey = this.getKey(key, options.namespace);
            const serializedValue = JSON.stringify(value);
            const ttl = options.ttl || this.defaultTTL;
            await this.redis.setex(finalKey, ttl, serializedValue);
        }
        catch (error) {
            this.logger.error(`Cache set error: ${error.message}`);
            throw error;
        }
    }
    async get(key, namespace) {
        try {
            const finalKey = this.getKey(key, namespace);
            const value = await this.redis.get(finalKey);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            this.logger.error(`Cache get error: ${error.message}`);
            throw error;
        }
    }
    async delete(key, namespace) {
        try {
            const finalKey = this.getKey(key, namespace);
            await this.redis.del(finalKey);
        }
        catch (error) {
            this.logger.error(`Cache delete error: ${error.message}`);
            throw error;
        }
    }
    async has(key, namespace) {
        try {
            const finalKey = this.getKey(key, namespace);
            return await this.redis.exists(finalKey) === 1;
        }
        catch (error) {
            this.logger.error(`Cache has error: ${error.message}`);
            throw error;
        }
    }
    async clear(namespace) {
        try {
            if (namespace) {
                const keys = await this.redis.keys(`${namespace}:*`);
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                }
            }
            else {
                await this.redis.flushdb();
            }
        }
        catch (error) {
            this.logger.error(`Cache clear error: ${error.message}`);
            throw error;
        }
    }
    async getMultiple(keys, namespace) {
        try {
            const finalKeys = keys.map(key => this.getKey(key, namespace));
            const values = await this.redis.mget(...finalKeys);
            return values.map(value => (value ? JSON.parse(value) : null));
        }
        catch (error) {
            this.logger.error(`Cache getMultiple error: ${error.message}`);
            throw error;
        }
    }
    async setMultiple(entries, options = {}) {
        try {
            const pipeline = this.redis.pipeline();
            const ttl = options.ttl || this.defaultTTL;
            entries.forEach(({ key, value }) => {
                const finalKey = this.getKey(key, options.namespace);
                const serializedValue = JSON.stringify(value);
                pipeline.setex(finalKey, ttl, serializedValue);
            });
            await pipeline.exec();
        }
        catch (error) {
            this.logger.error(`Cache setMultiple error: ${error.message}`);
            throw error;
        }
    }
    async close() {
        await this.redis.quit();
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String])
], CacheService);
