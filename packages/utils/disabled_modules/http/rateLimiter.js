"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
import logging_1 from '../logging.js';
class RateLimiter {
    constructor(config = { windowMs: 60000, maxRequests: 100 }) {
        this.limits = new Map();
        this.config = config;
    }
}
() => ;
(key) => {
    const now = Date.now();
    const entry = this.limits.get(key);
    if (!entry) {
        this.limits.set(key, {
            count: 1,
            resetTime: now + this.config.windowMs
        });
        return true;
    }
    if (now > entry.resetTime) {
        this.limits.set(key, {
            count: 1,
            resetTime: now + this.config.windowMs
        });
        return true;
    }
    if (entry.count >= this.config.maxRequests) {
        logging_1.logger.warn(`Rate limit exceeded for key: ${key}`);
        return false;
    }
    entry.count++;
    return true;
};
getRemainingRequests(key);
{
    const entry = this.limits.get(key);
    if (!entry) {
        return this.config.maxRequests;
    }
    if (Date.now() > entry.resetTime) {
        return this.config.maxRequests;
    }
    return Math.max(0, this.config.maxRequests - entry.count);
}
async;
cleanupExpiredEntries();
Promise();
Promise();
{
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
        if (now > entry.resetTime) {
            this.limits.delete(key);
        }
    }
}
exports.RateLimiter = RateLimiter;
// Create singleton instance
const globalRateLimiter = new RateLimiter();
// Clean up expired entries every minute
setInterval(() => {
    globalRateLimiter.cleanupExpiredEntries();
}, 60000);
exports.default = globalRateLimiter;
export {};
//# sourceMappingURL=rateLimiter.js.map