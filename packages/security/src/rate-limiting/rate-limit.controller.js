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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const rate_limiter_service_1 = require("./rate-limiter.service");
const rate_limit_guard_1 = require("./rate-limit.guard");
let RateLimitController = class RateLimitController {
    rateLimiterService;
    constructor(rateLimiterService) {
        this.rateLimiterService = rateLimiterService;
    }
    async getRateLimitStatus(key, windowMs, max, req) {
        // Only allow admins to check rate limit status
        if (!this.isAdmin(req.user)) {
            throw new common_1.UnauthorizedException('Admin access required');
        }
        const options = {
            ...(windowMs && { windowMs: Number(windowMs) }),
            ...(max && { max: Number(max) }),
        };
        const result = await this.rateLimiterService.getRateLimitStatus(key, options);
        return {
            ...result,
            resetTime: new Date(Date.now() + result.msBeforeNext),
        };
    }
    async resetRateLimit(key, req) {
        if (!this.isAdmin(req.user)) {
            throw new common_1.UnauthorizedException('Admin access required');
        }
        await this.rateLimiterService.resetRateLimit(key);
        return {
            message: 'Rate limit reset successfully',
            key,
        };
    }
    async clearAllRateLimits(req) {
        if (!this.isSuperAdmin(req.user)) {
            throw new common_1.UnauthorizedException('Super admin access required');
        }
        await this.rateLimiterService.clearAllRateLimits();
        return {
            message: 'All rate limits cleared successfully',
            timestamp: new Date(),
        };
    }
    async getRateLimitStats(req) {
        if (!this.isAdmin(req.user)) {
            throw new common_1.UnauthorizedException('Admin access required');
        }
        const stats = await this.rateLimiterService.getRateLimitStats();
        return {
            ...stats,
            generatedAt: new Date(),
        };
    }
    async checkAuthEndpointRateLimit(endpoint, identifier, req) {
        if (!this.isAdmin(req.user)) {
            throw new common_1.UnauthorizedException('Admin access required');
        }
        if (!identifier) {
            throw new common_1.UnauthorizedException('Identifier is required');
        }
        // Decode the endpoint parameter
        const decodedEndpoint = decodeURIComponent(endpoint);
        const result = await this.rateLimiterService.checkAuthRateLimit(decodedEndpoint, identifier, undefined // Don't specify success/failure for status check
        );
        return {
            endpoint: decodedEndpoint,
            identifier,
            isAllowed: result.isAllowed,
            remainingAttempts: result.remainingPoints,
            totalHits: result.totalHits,
            resetTime: new Date(Date.now() + result.msBeforeNext),
            blockedUntil: result.isAllowed ? null : new Date(Date.now() + result.msBeforeNext),
        };
    }
    isAdmin(user) {
        return user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');
    }
    isSuperAdmin(user) {
        return user?.roles?.includes('SUPER_ADMIN');
    }
};
exports.RateLimitController = RateLimitController;
__decorate([
    (0, common_1.Get)('status/:key'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get rate limit status for a key',
        description: 'Check current rate limit status without incrementing the counter'
    }),
    (0, swagger_1.ApiParam)({
        name: 'key',
        description: 'Rate limit key to check',
        example: 'auth:login:ip:192.168.1.1'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'windowMs',
        required: false,
        description: 'Time window in milliseconds',
        example: 900000
    }),
    (0, swagger_1.ApiQuery)({
        name: 'max',
        required: false,
        description: 'Maximum requests per window',
        example: 5
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rate limit status retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                totalHits: { type: 'number', example: 3 },
                remainingPoints: { type: 'number', example: 2 },
                msBeforeNext: { type: 'number', example: 0 },
                isAllowed: { type: 'boolean', example: true },
                resetTime: { type: 'string', format: 'date-time' },
            }
        }
    }),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Query)('windowMs')),
    __param(2, (0, common_1.Query)('max')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], RateLimitController.prototype, "getRateLimitStatus", null);
__decorate([
    (0, common_1.Delete)('reset/:key'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Reset rate limit for a key (Admin)',
        description: 'Reset rate limiting counters and blocks for a specific key'
    }),
    (0, swagger_1.ApiParam)({
        name: 'key',
        description: 'Rate limit key to reset',
        example: 'auth:login:ip:192.168.1.1'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rate limit reset successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Rate limit reset successfully' },
                key: { type: 'string', example: 'auth:login:ip:192.168.1.1' },
            }
        }
    }),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RateLimitController.prototype, "resetRateLimit", null);
__decorate([
    (0, common_1.Delete)('clear-all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, rate_limit_guard_1.RateLimit)({
        options: { windowMs: 60000, max: 1 }, // Only allow once per minute
        errorMessage: 'Clear all operation can only be performed once per minute',
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'Clear all rate limits (Admin)',
        description: 'Clear all rate limiting data - use with extreme caution'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All rate limits cleared successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'All rate limits cleared successfully' },
                timestamp: { type: 'string', format: 'date-time' },
            }
        }
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RateLimitController.prototype, "clearAllRateLimits", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get rate limiting statistics (Admin)',
        description: 'Get comprehensive statistics about rate limiting usage'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rate limiting statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                totalKeys: { type: 'number', example: 150 },
                blockedKeys: { type: 'number', example: 5 },
                topAbusers: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            key: { type: 'string', example: 'auth:login:ip:192.168.1.100' },
                            hits: { type: 'number', example: 25 },
                        }
                    }
                }
            }
        }
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RateLimitController.prototype, "getRateLimitStats", null);
__decorate([
    (0, common_1.Get)('check/:endpoint'),
    (0, swagger_1.ApiOperation)({
        summary: 'Check rate limit for auth endpoint',
        description: 'Check rate limit status for a specific authentication endpoint'
    }),
    (0, swagger_1.ApiParam)({
        name: 'endpoint',
        description: 'Authentication endpoint to check',
        example: '/auth/login'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'identifier',
        description: 'IP address or user identifier',
        example: '192.168.1.1'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rate limit check completed',
        schema: {
            type: 'object',
            properties: {
                endpoint: { type: 'string', example: '/auth/login' },
                identifier: { type: 'string', example: '192.168.1.1' },
                isAllowed: { type: 'boolean', example: true },
                remainingAttempts: { type: 'number', example: 2 },
                resetTime: { type: 'string', format: 'date-time' },
            }
        }
    }),
    __param(0, (0, common_1.Param)('endpoint')),
    __param(1, (0, common_1.Query)('identifier')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RateLimitController.prototype, "checkAuthEndpointRateLimit", null);
exports.RateLimitController = RateLimitController = __decorate([
    (0, swagger_1.ApiTags)('Security - Rate Limiting'),
    (0, common_1.Controller)('security/rate-limit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [rate_limiter_service_1.RateLimiterService])
], RateLimitController);
//# sourceMappingURL=rate-limit.controller.js.map