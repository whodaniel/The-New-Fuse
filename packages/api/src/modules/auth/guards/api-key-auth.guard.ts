import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyAuthGuard.name);
  private readonly expectedApiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.expectedApiKey = this.configService.get<string>('MCP_REGISTRY_API_KEY');
    if (!this.expectedApiKey) {
      this.logger.warn('MCP_REGISTRY_API_KEY is not set. API Key authentication will fail.');
    }
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (!this.expectedApiKey) {
        this.logger.error('API Key Guard cannot activate because MCP_REGISTRY_API_KEY is not configured.');
        throw new UnauthorizedException('Internal configuration error.'); // Don't allow access if key isn't set
    }

    const request = context.switchToHttp().getRequest();
    const providedApiKey = request.headers['x-api-key'];

    if (!providedApiKey) {
      this.logger.warn('Missing X-API-Key header in request.');
      throw new UnauthorizedException('Missing API Key.');
    }

    if (providedApiKey !== this.expectedApiKey) {
      this.logger.warn('Invalid API Key received.');
      throw new UnauthorizedException('Invalid API Key.');
    }

    this.logger.debug('Valid API Key received.');
    return true; // API key is valid
  }
}
