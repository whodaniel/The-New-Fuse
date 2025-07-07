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
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const config_1 = require("@nestjs/config");
let RedisService = class RedisService {
    configService;
    client;
    pubClient;
    subClient;
    constructor(configService) {
        this.configService = configService;
        const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
        this.client = new ioredis_1.Redis(redisUrl);
        this.pubClient = new ioredis_1.Redis(redisUrl);
        this.subClient = new ioredis_1.Redis(redisUrl);
    }
    async get(key) {
        return this.client.get(key);
    }
    async set(key, value) {
        return this.client.set(key, value);
    }
    async setex(key, ttl, value) {
        return this.client.setex(key, ttl, value);
    }
    getSubClient() {
        return this.subClient;
    }
    getPubClient() {
        return this.pubClient;
    }
    async del(key) {
        return this.client.del(key);
    }
    async exists(key) {
        return this.client.exists(key);
    }
    async flushall() {
        return this.client.flushall();
    }
    async publish(channel, message) {
        return this.pubClient.publish(channel, message);
    }
    async subscribe(channel) {
        await this.subClient.subscribe(channel);
    }
    async onModuleInit() {
        // Subscribe to agent communication channels
        await this.subClient.subscribe('agent:composer', 'agent:roo-coder');
        this.subClient.on('message', (channel, message) => {
            this.handleAgentMessage(channel, message);
        });
    }
    async onModuleDestroy() {
        await this.client.quit();
        await this.pubClient.quit();
        await this.subClient.quit();
    }
    async handleAgentMessage(channel, message) {
        try {
            const data = JSON.parse(message);
            switch (channel) {
                case 'agent:composer':
                    await this.handleComposerMessage(data);
                    break;
                case 'agent:roo-coder':
                    await this.handleRooCoderMessage(data);
                    break;
            }
        }
        catch (error) {
            console.error('Error handling agent message:', error);
        }
    }
    async handleComposerMessage(data) {
        // Handle messages from Composer agent
    }
    async handleRooCoderMessage(data) {
        // Handle messages from Roo Coder agent
    }
    async sendToComposer(message) {
        await this.pubClient.publish('agent:composer', JSON.stringify(message));
    }
    async sendToRooCoder(message) {
        await this.pubClient.publish('agent:roo-coder', JSON.stringify(message));
    }
    // Helper methods for agent communication
    async getAgentState(agentId) {
        const state = await this.client.get(`agent:state:${agentId}`);
        return state ? JSON.parse(state) : null;
    }
    async setAgentState(agentId, state) {
        await this.client.set(`agent:state:${agentId}`, JSON.stringify(state));
    }
    async clearAgentState(agentId) {
        await this.client.del(`agent:state:${agentId}`);
    }
    async getTasks() {
        // Implementation...
    }
    async cleanup() {
        // Implementation...
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
