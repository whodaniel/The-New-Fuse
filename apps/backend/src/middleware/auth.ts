import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@the-new-fuse/types';
import { PrismaClient } from '@prisma/client';

import { RedisService } from '../services/redis.service.js';
import { ConfigService } from '@nestjs/config';

const prisma = new PrismaClient();
const configService = new ConfigService();
const redisService = new RedisService(configService);

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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    // Attach the full user object and userId for convenience
    req.user = user;
    req.userId = user.id;
    
    // Cache user in Redis for 1 hour
    try {
      await redisService.setex(`user:${user.id}`, 3600, JSON.stringify(user));
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
