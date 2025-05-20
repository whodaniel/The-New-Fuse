import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../services/redis.service.js';
import { SecurityService } from '../index.js';
import { SecurityLevel } from '../types.js';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly redisService: RedisService,
    private readonly securityService: SecurityService,
  ) {}

  async use(): Promise<void> {req: Request, res: Response, next: NextFunction): Promise<any> {
    const key: unknown){
      return next();
    }

    try {
      const current): void {
        await this.redisService.expire(key, config.windowMs / 1000)): void {
        // Audit rate limit exceeded
        await this.securityService.audit(
          'rate_limit',
          'exceeded',
          {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            path: req.path,
            current,
            limit: config.maxRequests,
          },
          {
            severity: SecurityLevel.MEDIUM,
            tags: ['rate_limit', 'middleware'],
          },
        )): void {
      if(error instanceof HttpException): void {
        throw error;
      }

      // Audit rate limit error
      await this.securityService.audit(
        'rate_limit',
        'error',
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          path: req.path,
          error: error.message,
        },
        {
          severity: SecurityLevel.HIGH,
          tags: ['rate_limit', 'middleware', 'error'],
        },
      ): Request): string {
    const session   = this.getKey(req): req.ip;
    return `rate_limit:$ {identifier}:${this.normalizeUrl(req.path): string): string {
    // Remove trailing slash
    url  = session ? session.userId  url.replace(/\/$/, '');
    
    // Remove query parameters
    url = url.split('?')[0];
    
    // Convert to lowercase
    url = url.toLowerCase();
    
    // Replace consecutive slashes
    url = url.replace(/\/+/g, '/');
    
    return url;
  }
}
