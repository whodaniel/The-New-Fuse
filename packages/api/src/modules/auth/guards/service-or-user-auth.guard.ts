import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js'; // Assuming this exists and works
import { ApiKeyAuthGuard } from './api-key-auth.guard.js';
import { Observable } from 'rxjs';

@Injectable()
export class ServiceOrUserAuthGuard implements CanActivate {
  private readonly logger = new Logger(ServiceOrUserAuthGuard.name);

  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    private readonly apiKeyGuard: ApiKeyAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try JWT authentication first
    try {
      const canActivateJwt = await this.jwtGuard.canActivate(context);
      if (canActivateJwt) {
        this.logger.debug('Access granted via JWT.');
        // Attach user to request if jwtGuard does that (important for @CurrentUser)
        // Assuming jwtGuard handles attaching the user object to the request
        return true;
      }
    } catch (jwtError) {
        // If JWT guard throws UnauthorizedException, it means JWT was present but invalid, or missing.
        // We don't log this as an error yet, as API key might still work.
        this.logger.debug(`JWT check failed or JWT not present: ${jwtError.message}`);
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
        // If API Key guard throws UnauthorizedException, it means key was invalid or missing.
        this.logger.debug(`API Key check failed: ${apiKeyError.message}`);
    }

    // If both failed, deny access
    this.logger.warn('Access denied. Neither valid JWT nor valid API Key provided.');
    throw new UnauthorizedException('Authentication required.');
  }
}
