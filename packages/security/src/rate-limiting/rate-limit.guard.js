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
exports.RateLimitGuard = exports.PasswordResetRateLimit = exports.RefreshTokenRateLimit = exports.LoginRateLimit = exports.RateLimit = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rate_limiter_service_1 = require("./rate-limiter.service");
exports.RATE_LIMIT_KEY = 'rate-limit';
// Decorator to apply rate limiting to endpoints
const RateLimit = (metadata = {}) => (0, common_1.SetMetadata)(exports.RATE_LIMIT_KEY, metadata);
exports.RateLimit = RateLimit;
// Predefined decorators for common auth scenarios
const LoginRateLimit = () => (0, exports.RateLimit)({
    name: 'login',
    options: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per 15 minutes
        blockDuration: 30 * 60 * 1000, // Block for 30 minutes
        skipSuccessfulRequests: true,
    },
    errorMessage: 'Too many login attempts. Please try again in 30 minutes.',
    keyGenerator: (req) => `login:ip:${req.ip},
  });

export const RegisterRateLimit = () =>
  RateLimit({
    name: 'register',
    options: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,                   // 3 registrations per hour
      blockDuration: 60 * 60 * 1000, // Block for 1 hour
    },
    errorMessage: 'Too many registration attempts. Please try again in 1 hour.',`,
    keyGenerator: (req) => `register:ip:${req.ip}`,
});
exports.LoginRateLimit = LoginRateLimit;
const RefreshTokenRateLimit = () => (0, exports.RateLimit)({
    name: 'refresh',
    options: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 10, // 10 refresh attempts per 5 minutes
        blockDuration: 10 * 60 * 1000, // Block for 10 minutes
    },
    errorMessage: 'Too many token refresh attempts. Please try again later.',
    keyGenerator: (req) => refresh, ip: $
}, { req, : .ip });
exports.RefreshTokenRateLimit = RefreshTokenRateLimit;
;
const PasswordResetRateLimit = () => (0, exports.RateLimit)({
    name: 'password-reset',
    options: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 password reset requests per hour
        blockDuration: 60 * 60 * 1000, // Block for 1 hour
    },
    errorMessage: 'Too many password reset attempts. Please try again in 1 hour.',
} `
    keyGenerator: (req) => password-reset:email:${req.body?.email || req.ip}`);
exports.PasswordResetRateLimit = PasswordResetRateLimit;
;
let RateLimitGuard = class RateLimitGuard {
    rateLimiterService;
    reflector;
    constructor(rateLimiterService, reflector) {
        this.rateLimiterService = rateLimiterService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const rateLimitMetadata = this.reflector.get(exports.RATE_LIMIT_KEY, context.getHandler());
        if (!rateLimitMetadata) {
            return true; // No rate limiting applied
        }
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        // Check if we should skip this request
        if (rateLimitMetadata.skipIf && rateLimitMetadata.skipIf(request)) {
            return true;
        }
        // Generate rate limit key
        const key = rateLimitMetadata.keyGenerator
            ? rateLimitMetadata.keyGenerator(request)
            : this.generateDefaultKey(request, rateLimitMetadata.name);
        // Check rate limit
        const result = await this.rateLimiterService.checkRateLimit(key, rateLimitMetadata.options || {});
        // Set rate limit headers
        this.setRateLimitHeaders(response, result, rateLimitMetadata.options);
        if (!result.isAllowed) {
            const errorMessage = rateLimitMetadata.errorMessage || 'Too many requests';
            throw new common_1.TooManyRequestsException({
                message: errorMessage,
                retryAfter: Math.ceil(result.msBeforeNext / 1000),
                limit: rateLimitMetadata.options?.max,
                remaining: result.remainingPoints,
                resetTime: new Date(Date.now() + result.msBeforeNext),
            });
        }
        return true;
    }
    generateDefaultKey(request, name) {
        const prefix = name || 'default';
        const identifier = request.ip || 'unknown';
        return $;
        {
            prefix;
        }
        $;
        {
            identifier;
        }
        `;
  }

  private setRateLimitHeaders(response: any, result: any, options?: RateLimitOptions): void {
    const limit = options?.max || 100;
    const windowSeconds = Math.ceil((options?.windowMs || 15 * 60 * 1000) / 1000);

    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, result.remainingPoints));
    response.setHeader('X-RateLimit-Reset', new Date(Date.now() + (result.msBeforeNext || 0)));
    response.setHeader('X-RateLimit-Window', windowSeconds);

    if (!result.isAllowed) {
      response.setHeader('Retry-After', Math.ceil(result.msBeforeNext / 1000));
    }
  }
};
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rate_limiter_service_1.RateLimiterService,
        core_1.Reflector])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map