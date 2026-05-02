import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class CommunityApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expected = this.configService.get<string>('COMMUNITY_API_KEY')?.trim();
    if (!expected) {
      throw new UnauthorizedException('Community API key is not configured');
    }

    const provided = request.get('x-community-api-key') || '';
    const normalized = Array.isArray(provided) ? provided[0] : provided;
    if (!normalized || normalized.trim() !== expected) {
      throw new UnauthorizedException('Invalid Community API key');
    }

    return true;
  }
}
