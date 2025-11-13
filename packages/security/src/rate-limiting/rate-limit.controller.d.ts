import { RateLimiterService, RateLimitResult } from './rate-limiter.service';
interface AuthenticatedRequest {
    user?: {
        id: string;
        email: string;
        roles: string[];
        isActive: boolean;
    };
}
export declare class RateLimitController {
    private readonly rateLimiterService;
    constructor(rateLimiterService: RateLimiterService);
    getRateLimitStatus(key: string, windowMs?: number, max?: number, req: AuthenticatedRequest): Promise<RateLimitResult & {
        resetTime: Date;
    }>;
    resetRateLimit(key: string, req: AuthenticatedRequest): Promise<{
        message: string;
        key: string;
    }>;
    clearAllRateLimits(req: AuthenticatedRequest): Promise<{
        message: string;
        timestamp: Date;
    }>;
    getRateLimitStats(req: AuthenticatedRequest): Promise<{
        generatedAt: Date;
        totalKeys: number;
        blockedKeys: number;
        topAbusers: Array<{
            key: string;
            hits: number;
        }>;
    }>;
    checkAuthEndpointRateLimit(endpoint: string, identifier: string, req: AuthenticatedRequest): Promise<{
        endpoint: string;
        identifier: string;
        isAllowed: boolean;
        remainingAttempts: number;
        totalHits: number;
        resetTime: Date;
        blockedUntil: Date | null;
    }>;
    private isAdmin;
    private isSuperAdmin;
}
export {};
//# sourceMappingURL=rate-limit.controller.d.ts.map