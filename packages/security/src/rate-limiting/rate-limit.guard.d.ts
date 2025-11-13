import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterService, RateLimitOptions } from './rate-limiter.service';
export declare const RATE_LIMIT_KEY = "rate-limit";
export interface RateLimitMetadata {
    name?: string;
    options?: RateLimitOptions;
    keyGenerator?: (req: any) => string;
    skipIf?: (req: any) => boolean;
    errorMessage?: string;
    skipSuccessful?: boolean;
    skipFailed?: boolean;
}
export declare const RateLimit: (metadata?: RateLimitMetadata) => import("@nestjs/common").CustomDecorator<string>;
export declare const LoginRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RefreshTokenRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare const PasswordResetRateLimit: () => import("@nestjs/common").CustomDecorator<string>;
export declare class RateLimitGuard implements CanActivate {
    private readonly rateLimiterService;
    private readonly reflector;
    constructor(rateLimiterService: RateLimiterService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private generateDefaultKey;
}
//# sourceMappingURL=rate-limit.guard.d.ts.map