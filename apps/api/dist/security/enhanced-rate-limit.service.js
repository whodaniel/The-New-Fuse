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
var EnhancedRateLimitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedRateLimitService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const security_logging_service_1 = require("./security-logging.service");
let EnhancedRateLimitService = EnhancedRateLimitService_1 = class EnhancedRateLimitService {
    constructor(configService, securityLogging) {
        this.configService = configService;
        this.securityLogging = securityLogging;
        this.logger = new common_1.Logger(EnhancedRateLimitService_1.name);
        this.rateLimitStore = new Map();
        this.BURST_WINDOW = 10000; // 10 seconds burst window
        // Define different rate limit tiers
        this.rateLimitTiers = {
            // Authentication endpoints - very strict
            auth: {
                name: 'auth',
                requests: 5,
                window: 60000, // 1 minute
                burstMultiplier: 2,
            },
            // API endpoints - medium strict
            api: {
                name: 'api',
                requests: 100,
                window: 60000, // 1 minute
                burstMultiplier: 1.5,
            },
            // Public endpoints - generous
            public: {
                name: 'public',
                requests: 200,
                window: 60000, // 1 minute
                burstMultiplier: 2,
            },
            // Admin endpoints - very strict
            admin: {
                name: 'admin',
                requests: 20,
                window: 60000, // 1 minute
                burstMultiplier: 1,
            },
            // Health checks - minimal
            health: {
                name: 'health',
                requests: 10,
                window: 60000, // 1 minute
                burstMultiplier: 3,
            },
        };
    }
    /**
     * Check rate limit for a request
     */
    async checkRateLimit(request, tier = 'api', customConfig) {
        const config = customConfig || this.rateLimitTiers[tier];
        const key = this.generateKey(request, config.keyGenerator);
        const now = Date.now();
        // Get or create rate limit data
        let rateLimitData = this.rateLimitStore.get(key);
        if (!rateLimitData) {
            rateLimitData = { count: 0, resetTime: now + config.window, burstCount: 0 };
        }
        // Reset window if expired
        if (now > rateLimitData.resetTime) {
            rateLimitData.count = 0;
            rateLimitData.burstCount = 0;
            rateLimitData.resetTime = now + config.window;
        }
        // Allow burst requests
        if (now < rateLimitData.resetTime + this.BURST_WINDOW && rateLimitData.burstCount < (config.burstMultiplier || 1)) {
            rateLimitData.burstCount++;
            rateLimitData.count++;
            this.rateLimitStore.set(key, rateLimitData);
            return {
                allowed: true,
                remaining: Math.max(0, config.requests - rateLimitData.count),
                resetTime: rateLimitData.resetTime,
            };
        }
        // Check if limit exceeded
        if (rateLimitData.count >= config.requests) {
            this.securityLogging.logRateLimit('limit_exceeded', {
                ip: this.getClientIP(request),
                userAgent: request.headers['user-agent'],
                endpoint: request.path,
                method: request.method,
                limit: config.requests,
                current: rateLimitData.count,
                window: config.window,
            });
            throw new common_1.HttpException({
                message: 'Rate limit exceeded',
                limit: config.requests,
                remaining: 0,
                resetTime: rateLimitData.resetTime,
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        // Increment counter
        rateLimitData.count++;
        this.rateLimitStore.set(key, rateLimitData);
        return {
            allowed: true,
            remaining: Math.max(0, config.requests - rateLimitData.count),
            resetTime: rateLimitData.resetTime,
        };
    }
    /**
     * Check rate limit with automatic tier detection
     */
    async checkRateLimitAuto(request) {
        const tier = this.detectTier(request);
        return this.checkRateLimit(request, tier);
    }
    /**
     * Block an IP address temporarily
     */
    blockIP(ip, duration = 300000) {
        const key = `blocked:${ip}`;
        const now = Date.now();
        const resetTime = now + duration;
        this.rateLimitStore.set(key, { count: 0, resetTime, burstCount: 0 });
        this.securityLogging.logRateLimit('ip_blocked', {
            ip,
            reason: `Blocked for ${duration}ms`,
        });
    }
    /**
     * Check if IP is blocked
     */
    isIPBlocked(ip) {
        const key = `blocked:${ip}`;
        const data = this.rateLimitStore.get(key);
        if (!data)
            return false;
        if (Date.now() > data.resetTime) {
            this.rateLimitStore.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Get current rate limit status
     */
    getRateLimitStatus(request, tier) {
        const config = this.rateLimitTiers[tier || this.detectTier(request)];
        const key = this.generateKey(request, config.keyGenerator);
        const data = this.rateLimitStore.get(key) || { count: 0, resetTime: Date.now() + config.window, burstCount: 0 };
        return {
            tier: tier || this.detectTier(request),
            limit: config.requests,
            remaining: Math.max(0, config.requests - data.count),
            resetTime: data.resetTime,
            burstAvailable: data.burstCount < (config.burstMultiplier || 1),
        };
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, data] of this.rateLimitStore.entries()) {
            if (now > data.resetTime && !key.startsWith('blocked:')) {
                this.rateLimitStore.delete(key);
            }
        }
    }
    /**
     * Generate rate limit key
     */
    generateKey(request, customKeyGenerator) {
        if (customKeyGenerator) {
            return customKeyGenerator(request);
        }
        // Default key generation based on IP and user agent
        const ip = this.getClientIP(request);
        const userAgent = request.headers['user-agent'] || 'unknown';
        const userId = request.user?.id || 'anonymous';
        return `rate_limit:${ip}:${userId}:${userAgent.substring(0, 50)}`;
    }
    /**
     * Get client IP address
     */
    getClientIP(request) {
        return request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            request.headers['x-real-ip'] ||
            request.connection.remoteAddress ||
            request.ip ||
            'unknown';
    }
    /**
     * Detect appropriate rate limit tier based on endpoint
     */
    detectTier(request) {
        const path = request.path?.toLowerCase() || '';
        const method = request.method?.toLowerCase() || '';
        // Authentication endpoints
        if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
            return 'auth';
        }
        // Admin endpoints
        if (path.includes('/admin/') || path.includes('/system/')) {
            return 'admin';
        }
        // Health check endpoints
        if (path.includes('/health') || path.includes('/ping')) {
            return 'health';
        }
        // Default to API tier
        return 'api';
    }
};
exports.EnhancedRateLimitService = EnhancedRateLimitService;
exports.EnhancedRateLimitService = EnhancedRateLimitService = EnhancedRateLimitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        security_logging_service_1.SecurityLoggingService])
], EnhancedRateLimitService);
//# sourceMappingURL=enhanced-rate-limit.service.js.map