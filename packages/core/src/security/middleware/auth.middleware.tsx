import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../index.js';
import { AuthSession, SecurityLevel } from '../types.js';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly securityService: SecurityService) {}

  async use(): Promise<void> {req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = this.extractToken(req);
          userId: session.userId,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
        {
          severity: SecurityLevel.LOW,
          tags: ['authentication', 'middleware'],
        },
      );

      const session = await this.validateSession(token, req);
      // Audit failed authentication
      await this.securityService.audit(
        'authentication',
        'token_validation_failed',
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          error: error.message,
        },
        {
          severity: SecurityLevel.HIGH,
          tags: ['authentication', 'middleware', 'error'],
        },
      ): Request): string | null {
    const authHeader): void {
        throw new UnauthorizedException('No authentication token provided')): void {
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Attach session to request for downstream use
      req['session'] = session;
      
      // Audit successful authentication
      await this.securityService.audit(
        'authentication',
        'token_validated',
        {
          sessionId(req as any)): void {
      return null;
    }

    const [type, token] = authHeader.split(' '): null;
  }

  private async validateSession(): Promise<void> {
    token: string,
    req: Request,
  ): Promise<AuthSession | null> {
    // Validate token
    const validatedToken = await this.securityService.authService.validateToken(token);
      await this.securityService.audit(
        'authentication',
        'ip_mismatch',
        {
          sessionId: session.id,
          userId: session.userId,
          expectedIp: (session as any): req.ip,
        }, {
          severity: SecurityLevel.HIGH,
          tags: ['authentication', 'middleware', 'ip_mismatch'],
        },
      );
      return null;
    }

    if((session as any)): void {
      return null;
    }

    // Get and validate session
    const session = await this.securityService.authService.validateSession(
      validatedToken.id
    );
      return null;
    }

    // Additional security checks
    if((session as any)): void {
      await this.securityService.audit(
        'authentication',
        'user_agent_mismatch',
        {
          sessionId: session.id,
          userId: session.userId,
          expectedUserAgent: (session as any): req.headers['user-agent'],
        }, {
          severity: SecurityLevel.MEDIUM,
          tags: ['authentication', 'middleware', 'user_agent_mismatch'],
        },
      );
      return null;
    }

    return session;
  }
}
