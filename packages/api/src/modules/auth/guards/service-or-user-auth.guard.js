var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ServiceOrUserAuthGuard_1;
var _a, _b;
import { Injectable, Logger } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard'; // Assuming this exists and works
import { ApiKeyAuthGuard } from './api-key-auth.guard';
let ServiceOrUserAuthGuard = ServiceOrUserAuthGuard_1 = class ServiceOrUserAuthGuard {
    jwtGuard;
    apiKeyGuard;
    logger = new Logger(ServiceOrUserAuthGuard_1.name);
    constructor(jwtGuard, apiKeyGuard) {
        this.jwtGuard = jwtGuard;
        this.apiKeyGuard = apiKeyGuard;
    }
    async canActivate(context) {
        // Try JWT authentication first
        try {
            const canActivateJwt = await this.jwtGuard.canActivate(context);
            if (canActivateJwt) {
                this.logger.debug('Access granted via JWT.');
                // Attach user to request if jwtGuard does that (important for @CurrentUser)
                // Assuming jwtGuard handles attaching the user object to the request
                return true;
            }
        }
        catch (jwtError) {
            // If JWT guard throws UnauthorizedException, it means JWT was present but invalid, or missing.
            // We don't log this as an error yet, as API key might still work.
            this.logger.debug(`JWT check failed or JWT not present: ${jwtError instanceof Error ? jwtError.message : 'Unknown error'});
    }

    // If JWT failed or wasn't present, try API Key authentication
    try {
      const canActivateApiKey = await this.apiKeyGuard.canActivate(context);
      if (canActivateApiKey) {
        this.logger.debug('Access granted via API Key.');
        // Note: If using API Key, there might not be a 'user' object.
        // Controllers using @CurrentUser need to handle cases where it might be undefined
        // or we need a way to represent the service identity. For now, we allow access.
        // A potential improvement: attach a service principal object to the request.
        const request = context.switchToHttp().getRequest();
        request.isServiceCall = true; // Mark the request as a service call
        return true;
      }
    } catch (apiKeyError) {
        // If API Key guard throws UnauthorizedException, it means key was invalid or missing.`, this.logger.debug(`API Key check failed: ${apiKeyError instanceof Error ? apiKeyError.message : 'Unknown error'}` `);
    }

    // If both failed, deny access
    this.logger.warn('Access denied. Neither valid JWT nor valid API Key provided.');
    throw new UnauthorizedException('Authentication required.');
  }
}
            ));
        }
    }
};
ServiceOrUserAuthGuard = ServiceOrUserAuthGuard_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof JwtAuthGuard !== "undefined" && JwtAuthGuard) === "function" ? _a : Object, typeof (_b = typeof ApiKeyAuthGuard !== "undefined" && ApiKeyAuthGuard) === "function" ? _b : Object])
], ServiceOrUserAuthGuard);
export { ServiceOrUserAuthGuard };
//# sourceMappingURL=service-or-user-auth.guard.js.map