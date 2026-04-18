import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ResourceRegistryApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const expectedApiKeys = this.readConfigValues([
      'RESOURCE_REGISTRY_API_KEY',
      'TNF_RESOURCE_REGISTRY_API_KEY',
      'API_KEY',
      'COMMUNITY_API_KEY',
    ]);
    const expectedBearerTokens = this.readConfigValues([
      'RESOURCE_REGISTRY_BEARER_TOKEN',
      'TNF_RESOURCE_REGISTRY_BEARER_TOKEN',
      'SUPER_ADMIN_TOKEN',
    ]);

    if (expectedApiKeys.length === 0 && expectedBearerTokens.length === 0) {
      throw new UnauthorizedException(
        'Resource registry ingest auth is not configured (missing API key/bearer token env)'
      );
    }

    const authorization = this.normalizeHeader(request.get('authorization'));
    if (authorization?.toLowerCase().startsWith('bearer ')) {
      const providedBearer = authorization.slice('bearer '.length).trim();
      if (providedBearer && expectedBearerTokens.includes(providedBearer)) {
        return true;
      }
    }

    const providedApiKey =
      this.normalizeHeader(request.get('x-api-key')) ||
      this.normalizeHeader(request.get('X-API-Key')) ||
      this.normalizeHeader(request.get('x-community-api-key'));
    if (providedApiKey && expectedApiKeys.includes(providedApiKey)) {
      return true;
    }

    throw new UnauthorizedException('Invalid resource registry ingest credentials');
  }

  private readConfigValues(keys: string[]): string[] {
    return keys
      .map((key) => this.normalizeHeader(this.configService.get<string>(key)))
      .filter((value): value is string => Boolean(value));
  }

  private normalizeHeader(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
      return String(value[0] || '').trim();
    }
    return String(value || '').trim();
  }
}
