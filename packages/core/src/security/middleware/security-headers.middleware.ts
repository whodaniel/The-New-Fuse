import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly helmetMiddleware;

  constructor() {
    this.helmetMiddleware = helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hsts: { maxAge: 31536000, includeSubDomains: true },
      ieNoOpen: true,
      noSniff: true,
      xssFilter: true,
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Apply Helmet middleware
    this.helmetMiddleware(req, res, (err) => {
      if (err) {
        // Handle Helmet errors if necessary
        return next(err);
      }
      // Add any other custom security headers here
      res.setHeader('X-Powered-By', 'The New Fuse');
      next();
    });
  }
}
