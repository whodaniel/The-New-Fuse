var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
let RateLimitGuard = class RateLimitGuard extends ThrottlerGuard {
    async getTracker(req) {
        // Use IP address as the primary tracker
        const ip = req.ip || req.connection.remoteAddress || "unknown";
        // If user is authenticated, use user ID for more accurate tracking
        if (req.user?.id) {
            return `user:${req.user.id};
    }
`;
            return `ip:${ip}` `;
  }

  protected async getErrorMessage(_context: ExecutionContext, _throttlerLimitDetail: ThrottlerLimitDetail): Promise<string> {
    return "Rate limit exceeded. Please try again later.";
  }
}
            ;
        }
    }
};
RateLimitGuard = __decorate([
    Injectable()
], RateLimitGuard);
export { RateLimitGuard };
//# sourceMappingURL=rate-limit.guard.js.map