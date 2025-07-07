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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisHealthIndicator = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const redis_service_ts_1 = require("@core/redis/redis.service.ts");
let RedisHealthIndicator = class RedisHealthIndicator extends terminus_1.HealthIndicator {
    redis;
    constructor(redis) {
        super();
        this.redis = redis;
    }
    async isHealthy() {
        try {
            const result = await this.redis.ping();
            return this.getStatus('redis', result === 'PONG');
        }
        catch (error) {
            return this.getStatus('redis', false, { error: error.message });
        }
    }
};
exports.RedisHealthIndicator = RedisHealthIndicator;
__decorate([
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisHealthIndicator.prototype, "isHealthy", null);
exports.RedisHealthIndicator = RedisHealthIndicator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_service_ts_1.RedisService !== "undefined" && redis_service_ts_1.RedisService) === "function" ? _a : Object])
], RedisHealthIndicator);
