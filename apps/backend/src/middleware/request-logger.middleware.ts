import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { drizzleApiLogsRepository } from '@the-new-fuse/database';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  private jwtService: JwtService;

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET must be defined in environment variables');
    }
    this.jwtService = new JwtService({ secret });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const start = Date.now();

    // Try to extract userId from token if present (best effort)
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        // Decode without verification first just to get ID quickly,
        // the guards will handle actual verification
        const decoded: any = this.jwtService.decode(token);
        userId = decoded?.sub || decoded?.id;
      } catch (e) {
        // ignore
      }
    }

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;

      // Log to console
      // this.logger.log(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);

      // Log to DB (exclude health checks/metrics to reduce noise)
      if (!originalUrl.includes('/health') && !originalUrl.includes('/metrics')) {
        drizzleApiLogsRepository
          .logRequest({
            method,
            path: originalUrl,
            statusCode,
            duration,
            ip: ip || req.socket.remoteAddress || '',
            userAgent,
            userId,
          } as any)
          .catch((err) => {
            this.logger.error(`Failed to log request to DB: ${err.message}`);
          });
      }
    });

    next();
  }
}
