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
exports.AgentCommunicationService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("./redis.service");
let AgentCommunicationService = class AgentCommunicationService {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async broadcastMessage(message) {
        await this.redis.publish('agent:broadcast', message);
    }
    async createDirectChannel(agentId) {
        const channelId = `agent:direct:${agentId}`;
        await this.redis.subscribe(channelId);
        return channelId;
    }
    async sendDirectMessage(targetAgent, message) {
        const channel = `agent:direct:${targetAgent}`;
        await this.redis.publish(channel, message);
    }
};
exports.AgentCommunicationService = AgentCommunicationService;
exports.AgentCommunicationService = AgentCommunicationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], AgentCommunicationService);
