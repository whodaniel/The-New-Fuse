import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { SecurityService } from '../security.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly jwtSecret: string;

  constructor(private readonly securityService: SecurityService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    this.jwtSecret = secret;
  }

  async use(req: any, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      await this.securityService.audit('auth.failure', { reason: 'No token provided' });
      throw new UnauthorizedException('No authentication token provided');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      await this.securityService.audit('auth.failure', { reason: 'Invalid token format' });
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      req.user = decoded; // Attach user to the request object
      await this.securityService.audit('auth.success', { userId: req.user.id });
      next();
    } catch (error) {
      await this.securityService.audit('auth.failure', {
        reason: 'Invalid token',
        error: error.message,
      });
      throw new UnauthorizedException('Invalid token');
    }
  }
}
