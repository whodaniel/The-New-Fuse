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
import { ConfigService } from '../config/ConfigService';
let MemoryManager = class MemoryManager {
    constructor(configService) {
        this.configService = configService;
        this.defaultTTL = 3600; // 1 hour
        const redisConfig = {
            host: this.configService.getRedisHost(),
            port: this.configService.getRedisPort(),
            password: this.configService.getRedisPassword(),
            db: this.configService.getRedisDb()
        };
        this.redis = new IORedis(redisConfig);
    }
    async store(key, value, ttl) {
        if (!key || key.trim() === '') {
            throw new Error('Key cannot be empty');
        }
        const serialized = JSON.stringify(value);
        const timeToLive = ttl || this.defaultTTL;
        await this.redis.setex(key, timeToLive, serialized);
    }
    async get(key) {
        if (!key || key.trim() === '') {
            throw new Error('Key cannot be empty');
        }
        const result = await this.redis.get(key);
        return result ? JSON.parse(result) : null;
    }
    async delete(key) {
        if (!key || key.trim() === '') {
            throw new Error('Key cannot be empty');
        }
        await this.redis.del(key);
    }
    async exists(key) {
        if (!key || key.trim() === '') {
            throw new Error('Key cannot be empty');
        }
        const result = await this.redis.exists(key);
        return result === 1;
    }
    async getKeys(pattern) {
        return await this.redis.keys(pattern);
    }
    async disconnect() {
        await this.redis.disconnect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
};
MemoryManager = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], MemoryManager);
export { MemoryManager };
