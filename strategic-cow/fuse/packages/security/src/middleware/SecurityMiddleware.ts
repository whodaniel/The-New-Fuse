import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { SecurityService } from '../SecurityService';
// import { Logger } from '@the-new-fuse/utils';
import { SecurityMiddlewareConfig } from './types';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  // private logger: Logger;

  constructor(
    private readonly securityService: SecurityService,
    private readonly config: SecurityMiddlewareConfig
  ) {
    // this.logger = new Logger('SecurityMiddleware');
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
    try {
      // Check for authentication token
      const token = this.extractToken(req);
      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      // Verify token and validate request
      try {
        const isValid = await this.securityService.validateRequest({
          req,
          resource: req.path,
          action: 'access',
        });

        if (!isValid) {
          return res.status(429).json({ error: 'Too many requests' });
        }
      } catch {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token',
        });
      }

      // Extract resource and action
      const resource = this.getResourceFromRequest(req);

      // Check resource access
      try {
        const hasAccess = await this.securityService.validateRequest({
          req,
          resource,
          action: 'access',
        });

        if (!hasAccess) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied',
          });
        }
      } catch {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied',
        });
      }

      next();
    } catch {
      // this.logger.error('Security middleware error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  private getResourceFromRequest(req: Request): string {
    const parts = req.path.split('/').filter(Boolean);
    return parts[0] || 'unknown';
  }

  private getActionFromRequest(req: Request): string {
    const methodToAction: Record<string, string> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };

    return methodToAction[req.method] || 'unknown';
  }
}
