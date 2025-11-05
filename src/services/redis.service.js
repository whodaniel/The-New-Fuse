var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRedisClient } from '../redis/redis-client';
import { LoggingService } from './loggingService';
let RedisService = class RedisService {
    configService;
    client = null;
    publisher = null;
    subscriber = null;
    logger;
    constructor(configService) {
        this.configService = configService;
        this.logger = new LoggingService('RedisService');
        // Fire and forget; connection method is async
        void this.connect();
    }
    async connect() {
        if (this.client) {
            return;
        }
        try {
            // Use shared client factory for consistency with repository conventions
            this.client = await createRedisClient();
            this.publisher = await createRedisClient();
            this.subscriber = await createRedisClient();
        }
        catch (error) {
            this.logger.error('Failed to create Redis connection: ' +
                (error instanceof Error ? error.message : String(error)));
            throw error;
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
        }
        if (this.publisher) {
            await this.publisher.quit();
            this.publisher = null;
        }
        if (this.subscriber) {
            await this.subscriber.quit();
            this.subscriber = null;
        }
    }
    getClient() {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        return this.client;
    }
    async set(key, value, mode, duration) {
        const client = this.getClient();
        if (mode === 'EX' && duration) {
            await client.set(key, value, 'EX', duration);
        }
        else {
            await client.set(key, value);
        }
    }
    async get(key) {
        const client = this.getClient();
        return client.get(key);
    }
    async del(key) {
        const client = this.getClient();
        await client.del(key);
    }
    async keys(pattern) {
        const client = this.getClient();
        return client.keys(pattern);
    }
    async flushDb() {
        const client = this.getClient();
        await client.flushDb();
    }
    async publish(channel, message) {
        if (!this.publisher) {
            throw new Error('Redis publisher not initialized');
        }
        return this.publisher.publish(channel, message);
    }
    async getSubscriber() {
        if (!this.subscriber) {
            throw new Error('Redis subscriber not initialized');
        }
        return this.subscriber;
    }
};
RedisService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], RedisService);
export { RedisService };
//# sourceMappingURL=redis.service.js.map