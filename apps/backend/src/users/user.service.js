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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_ts_1 = require("@core/redis/redis.service.ts");
let UserService = class UserService {
    redis;
    CACHE_TTL = 3600; // 1 hour in seconds
    CACHE_PREFIX = 'user:';
    constructor(redis) {
        this.redis = redis;
    }
    async getUserById(id) {
        // Try to get from cache first
        const cached = await this.redis.get(`${this.CACHE_PREFIX}${id}`);
        if (cached) {
            return JSON.parse(cached);
        }
        // If not in cache, fetch from database
        const user = await this.fetchUserFromDb(id);
        if (user) {
            // Store in cache
            await this.redis.set(`${this.CACHE_PREFIX}${id}`, JSON.stringify(user), this.CACHE_TTL);
        }
        return user;
    }
    async invalidateUserCache(id) {
        await this.redis.del(`${this.CACHE_PREFIX}${id}`);
    }
    async fetchUserFromDb(id) {
        // Your database query logic here
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_service_ts_1.RedisService !== "undefined" && redis_service_ts_1.RedisService) === "function" ? _a : Object])
], UserService);
