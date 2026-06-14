import { Request } from 'express';
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}
interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
}
export declare class RateLimitingService {
    private store;
    private readonly config;
    constructor(config?: Partial<RateLimitConfig>);
    checkRateLimit(req: Request): Promise<RateLimitResult>;
    isAllowed(req: Request): Promise<RateLimitResult>;
    private getKey;
    private cleanup;
}
export {};
//# sourceMappingURL=index.d.ts.map