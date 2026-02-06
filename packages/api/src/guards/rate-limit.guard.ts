import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as the primary tracker
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // If user is authenticated, use user ID for more accurate tracking
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }

    return `ip:${ip}`;
  }

  protected async getErrorMessage(
    _context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail
  ): Promise<string> {
    return 'Rate limit exceeded. Please try again later.';
  }
}
