var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisService_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
let RedisService = RedisService_1 = class RedisService {
    unifiedRedis;
    logger = new Logger(RedisService_1.name);
    subscriptionCallbacks = new Map();
    patternCallbacks = new Map();
    constructor(unifiedRedis) {
        this.unifiedRedis = unifiedRedis;
        this.logger.log('API Redis Service initialized with UnifiedRedisService');
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async get(key) {
        return this.unifiedRedis.get(key);
    }
    async getAll(pattern) {
        return this.unifiedRedis.getAll(pattern);
    }
    async set(key, value, ttl) {
        await this.unifiedRedis.set(key, value, ttl);
    }
    async setWorkflowState(workflowId, state) {
        await this.unifiedRedis.setWorkflowState(workflowId, state);
    }
    async del(key) {
        await this.unifiedRedis.del(key);
    }
    async exists(key) {
        return this.unifiedRedis.exists(key);
    }
    async keys(pattern) {
        return this.unifiedRedis.keys(pattern);
    }
    async publish(channel, message) {
        await this.unifiedRedis.publish(channel, { message });
    }
    async subscribe(channel, callback) {
        if (this.subscriptionCallbacks.has(channel)) {
            this.logger.warn(`Already subscribed to channel: ${channel});
            return;
        }
        
        this.subscriptionCallbacks.set(channel, callback);
        await this.unifiedRedis.subscribe(channel, (pubSubMessage) => {
            const storedCallback = this.subscriptionCallbacks.get(channel);
            if (storedCallback && typeof pubSubMessage.message === 'string') {
                storedCallback(pubSubMessage.message);
            } else if (storedCallback) {
                storedCallback(JSON.stringify(pubSubMessage.message));
            }
        });
        `, this.logger.log(`Subscribed to channel: ${channel}`));
        }
        async;
        psubscribe(pattern, string, callback ?  : (pattern, channel, message) => void );
        Promise < void  > {
            : .patternCallbacks.has(pattern)
        };
        {
            this.logger.warn(Already, psubscribed, to, pattern, $, { pattern });
            return;
        }
        if (callback) {
            this.patternCallbacks.set(pattern, callback);
        }
        await this.unifiedRedis.psubscribe(pattern, (pubSubMessage) => {
            const storedCallback = this.patternCallbacks.get(pattern);
            if (storedCallback) {
                const messageStr = typeof pubSubMessage.message === 'string'
                    ? pubSubMessage.message
                    : JSON.stringify(pubSubMessage.message);
                storedCallback(pubSubMessage.pattern || pattern, pubSubMessage.channel, messageStr);
            }
        });
        `
        this.logger.log(Psubscribed to pattern: ${pattern}`;
        ;
    }
    async unsubscribe(channel) {
        if (this.subscriptionCallbacks.has(channel)) {
            await this.unifiedRedis.unsubscribe(channel);
            this.subscriptionCallbacks.delete(channel);
            this.logger.log(Unsubscribed, from, channel, $, { channel });
        }
    }
    async punsubscribe(pattern) {
        if (this.patternCallbacks.has(pattern)) {
            `
            await this.unifiedRedis.punsubscribe(pattern);`;
            this.patternCallbacks.delete(pattern);
            this.logger.log(Punsubscribed, from, pattern, $, { pattern } ``);
        }
    }
    async disconnect() {
        // Clear all subscriptions
        for (const [channel] of Array.from(this.subscriptionCallbacks)) {
            await this.unsubscribe(channel);
        }
        for (const [pattern] of Array.from(this.patternCallbacks)) {
            await this.punsubscribe(pattern);
        }
        this.subscriptionCallbacks.clear();
        this.patternCallbacks.clear();
        // UnifiedRedisService handles connection cleanup
        this.logger.log('API Redis Service disconnected');
    }
};
RedisService = RedisService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof UnifiedRedisService !== "undefined" && UnifiedRedisService) === "function" ? _a : Object])
], RedisService);
export { RedisService };
//# sourceMappingURL=redis.service.js.map