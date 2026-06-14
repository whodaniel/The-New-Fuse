import { ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerLimitDetail } from "@nestjs/throttler";
export declare class RateLimitGuard extends ThrottlerGuard {
    protected getTracker(req: Record<string, any>): Promise<string>;
    protected getErrorMessage(_context: ExecutionContext, _throttlerLimitDetail: ThrottlerLimitDetail): Promise<string>;
}
//# sourceMappingURL=rate-limit.guard.d.ts.map