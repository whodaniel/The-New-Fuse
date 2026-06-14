var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
/**
 * Rate Limiter for code execution
 */
import { Injectable } from '@nestjs/common';
let RateLimiter = class RateLimiter {
    constructor(maxRequests, windowMs) {
        this.clients = new Map();
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    isRateLimited(clientId) {
        const now = Date.now();
        const timestamps = this.clients.get(clientId) || [];
        const recentTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
        if (recentTimestamps.length >= this.maxRequests) {
            return true;
        }
        recentTimestamps.push(now);
        this.clients.set(clientId, recentTimestamps);
        return false;
    }
};
RateLimiter = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Number, Number])
], RateLimiter);
export { RateLimiter };
//# sourceMappingURL=rate-limiter.js.map