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
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
let CommunicationTracker = class CommunicationTracker {
    constructor(redisService) {
        this.recordsKey = 'communication:records';
        this.blockchainKey = 'communication:blockchain';
        this.modelKey = 'communication:model';
        this.tokenKey = 'communication:token';
        this.walletKey = 'communication:wallet';
        this.resourceKey = 'communication:resource';
        this.redisService = redisService;
    }
    async trackCommunication(record) {
        await this.redisService.lpush(this.recordsKey, JSON.stringify(record));
        await this.redisService.expire(this.recordsKey, 86400); // 24 hours
    }
    async getCommunicationHistory(agentId, limit = 100) {
        const records = await this.redisService.lrange(this.recordsKey, 0, limit - 1);
        return records
            .map(r => JSON.parse(r))
            .filter(r => r.fromAgent === agentId || r.toAgent === agentId);
    }
    async getRecentCommunications(limit = 50) {
        const records = await this.redisService.lrange(this.recordsKey, 0, limit - 1);
        return records.map(r => JSON.parse(r));
    }
    async clearHistory() {
        await this.redisService.del(this.recordsKey);
    }
    async getMetrics(agentId) {
        const history = await this.getCommunicationHistory(agentId);
        const sent = history.filter(r => r.fromAgent === agentId);
        const received = history.filter(r => r.toAgent === agentId);
        const successful = history.filter(r => r.status === 'received');
        return {
            totalSent: sent.length,
            totalReceived: received.length,
            successRate: history.length > 0 ? successful.length / history.length : 0
        };
    }
};
CommunicationTracker = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UnifiedRedisService])
], CommunicationTracker);
export { CommunicationTracker };
//# sourceMappingURL=CommunicationTracker.js.map