var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function') r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function') return Reflect.metadata(k, v);
};
var RedisService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';
let RedisService = RedisService_1 = class RedisService {
    configService;
    logger = new Logger(RedisService_1.name);
    redis;
    subClient;
    constructor(configService) {
        this.configService = configService;
        const redisConfig = {
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            db: this.configService.get('REDIS_DB', 0)
        };
        this.redis = new Redis.default(redisConfig);
        this.subClient = new Redis.default(redisConfig);
        this.logger.log('Redis service initialized');
    }
    async onModuleDestroy() {
        await this.redis.quit();
        await this.subClient.quit();
        this.logger.log('Redis connections closed');
    }
    // Basic Redis Operations
    async get(key) {
        try {
            return await this.redis.get(key);
        }
        catch (error) {
            this.logger.error('Failed to get key', { key, error });
            throw error;
        }
    }
    async set(key, value, ttl) {
        try {
            if (ttl) {
                await this.redis.set(key, value, 'EX', ttl);
            }
            else {
                await this.redis.set(key, value);
            }
        }
        catch (error) {
            this.logger.error('Failed to set key', { key, error });
            throw error;
        }
    }
    async del(key) {
        try {
            return await this.redis.del(key);
        }
        catch (error) {
            this.logger.error('Failed to delete key', { key, error });
            throw error;
        }
    }
    async exists(key) {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            this.logger.error('Failed to check key existence', { key, error });
            throw error;
        }
    }
    async hset(key, fieldOrData, value) {
        try {
            if (typeof fieldOrData === 'string' && value !== undefined) {
                await this.redis.hset(key, fieldOrData, value);
            }
            else if (typeof fieldOrData === 'object') {
                await this.redis.hset(key, fieldOrData);
            }
            else {
                throw new Error('Invalid arguments for hset');
            }
        }
        catch (error) {
            this.logger.error('Failed to set hash field', { key, error });
            throw error;
        }
    }
    async hget(key, field) {
        try {
            return await this.redis.hget(key, field);
        }
        catch (error) {
            this.logger.error('Failed to get hash field', { key, field, error });
            throw error;
        }
    }
    async hgetall(key) {
        try {
            return await this.redis.hgetall(key);
        }
        catch (error) {
            this.logger.error('Failed to get all hash fields', { key, error });
            throw error;
        }
    }
    // Pub/Sub Operations
    async publish(channel, message) {
        try {
            const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
            return await this.redis.publish(channel, messageStr);
        }
        catch (error) {
            this.logger.error('Failed to publish message', { channel, error });
            throw error;
        }
    }
    async subscribe(channel, callback) {
        try {
            await this.subClient.subscribe(channel);
            this.subClient.on('message', (ch, message) => {
                if (ch === channel) {
                    callback(message);
                }
            });
        }
        catch (error) {
            this.logger.error('Failed to subscribe to channel', { channel, error });
            throw error;
        }
    }
    async unsubscribe(channel) {
        try {
            await this.subClient.unsubscribe(channel);
        }
        catch (error) {
            this.logger.error('Failed to unsubscribe from channel', { channel, error });
            throw error;
        }
    }
    // List Operations
    async lpush(key, ...values) {
        try {
            return await this.redis.lpush(key, ...values);
        }
        catch (error) {
            this.logger.error('Failed to push to list', { key, error });
            throw error;
        }
    }
    async rpop(key) {
        try {
            return await this.redis.rpop(key);
        }
        catch (error) {
            this.logger.error('Failed to pop from list', { key, error });
            throw error;
        }
    }
    async llen(key) {
        try {
            return await this.redis.llen(key);
        }
        catch (error) {
            this.logger.error('Failed to get list length', { key, error });
            throw error;
        }
    }
    // Utility methods
    async ping() {
        try {
            return await this.redis.ping();
        }
        catch (error) {
            this.logger.error('Failed to ping Redis', { error });
            throw error;
        }
    }
    async flushdb() {
        try {
            await this.redis.flushdb();
            this.logger.log('Redis database flushed');
        }
        catch (error) {
            this.logger.error('Failed to flush Redis database', { error });
            throw error;
        }
    }
};
RedisService = RedisService_1 = __decorate([
    Injectable(),
    __metadata('design:paramtypes', [ConfigService])
], RedisService);
export { RedisService };
