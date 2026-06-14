export declare class RateLimiter {
    private readonly clients;
    private readonly maxRequests;
    private readonly windowMs;
    constructor(maxRequests: number, windowMs: number);
    isRateLimited(clientId: string): boolean;
}
//# sourceMappingURL=rate-limiter.d.ts.map