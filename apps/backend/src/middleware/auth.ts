import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@the-new-fuse/types';
import { drizzleUserRepository } from '@the-new-fuse/database/drizzle';

import { RedisService } from '../services/redis.service';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();
const redisService = new RedisService();

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret-key') as {
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
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Export as authMiddleware for compatibility
export const authMiddleware = auth;
