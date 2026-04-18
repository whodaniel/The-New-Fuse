import { drizzleUserRepository } from '@the-new-fuse/database';
import { User } from '@the-new-fuse/types';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { AppConfigService } from '../config/app-config.service';
import { RedisService } from '../services/redis.service';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

/**
 * Authentication Middleware Factory
 *
 * Creates an authentication middleware with access to AppConfigService.
 * This ensures JWT secrets are properly validated and no hardcoded defaults exist.
 *
 * @param appConfig - Validated AppConfigService instance
 * @param redisService - Redis service for caching user data
 * @returns Express middleware function
 */
export const createAuthMiddleware = (appConfig: AppConfigService, redisService: RedisService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
      }

      const token = authHeader.split(' ')[1];

      // Use validated JWT secret from AppConfigService (no fallback defaults)
      const decoded = jwt.verify(token, appConfig.jwtSecret) as {
        id: string;
      };

      // Fetch full user object from database
      // Check Redis cache first
      try {
        const cachedUser = await redisService.get(`user:${decoded.id}`);
        if (cachedUser) {
          req.user = JSON.parse(cachedUser);
          req.userId = decoded.id;
          next();
          return;
        }
      } catch (redisError) {
        console.warn('Redis cache error, falling back to database:', redisError);
      }

      const user = await drizzleUserRepository.findById(decoded.id);

      if (!user) {
        res.status(401).json({ success: false, message: 'User not found' });
        return;
      }

      // Attach the full user object and userId for convenience
      req.user = user;
      req.userId = user.id;

      // Cache user in Redis for 1 hour
      try {
        await redisService.set(`user:${user.id}`, JSON.stringify(user), 3600);
      } catch (redisError) {
        console.warn('Redis cache set error:', redisError);
      }

      next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  };
};

// REMOVED: Legacy auth and authMiddleware exports
// Migration: Use createAuthMiddleware() with AppConfigService dependency injection
// See apps/backend/src/config/app-config.service.ts for secure configuration
