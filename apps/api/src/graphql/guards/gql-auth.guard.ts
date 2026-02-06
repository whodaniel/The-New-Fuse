import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { SecurityLoggingService } from '../../security/security-logging.service';

@Injectable()
export class GqlAuthGuard {
  constructor(
    private jwtService: JwtService,
    private securityLogging: SecurityLoggingService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
      };

      req.user = user;

      this.securityLogging.logAuthEvent('login', {
        userId: user.id,
        ip: this.getClientIP(req),
        endpoint: ctx.getInfo()?.fieldName,
        success: true,
      });

      return true;
    } catch (error) {
      this.securityLogging.logAuthEvent('auth_failure', {
        ip: this.getClientIP(req),
        endpoint: ctx.getInfo()?.fieldName,
        success: false,
        reason: 'Invalid or expired token',
        metadata: { error: (error as Error).message },
      });
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private getClientIP(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }
}
