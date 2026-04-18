/**
 * JWT Blacklist Guard
 *
 * Extends the standard JWT guard to check if the token is blacklisted.
 * Used in addition to the standard JWT validation.
 */

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenBlacklistService } from './token-blacklist.service.js';

@Injectable()
export class JwtBlacklistGuard implements CanActivate {
  constructor(
    private readonly tokenBlacklist: TokenBlacklistService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (token) {
      // Check if token is blacklisted
      const isBlacklisted = await this.tokenBlacklist.isBlacklisted(token);

      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // If no token, let the standard JWT guard handle it
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return undefined;
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return undefined;
    }

    return parts[1];
  }
}
