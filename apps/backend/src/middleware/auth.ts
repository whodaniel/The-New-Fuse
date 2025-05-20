import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@the-new-fuse/types';
import { PrismaClient } from '@the-new-fuse/database/client';

import { RedisService } from '../services/redis.service.js';

const prisma = new PrismaClient();
const redisService = new RedisService();

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret-key') as {
      id: string;
    };

    // Fetch full user object from database
    // Check Redis cache first
const cachedUser = await redisService.get(`user:${decoded.id}`);
if (cachedUser) {
  req.user = JSON.parse(cachedUser);
  req.userId = decoded.id;
  return next();
}

const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Attach the full user object and userId for convenience
    req.user = user;
    req.userId = user.id;
    // Cache user in Redis for 1 hour
    await redisService.set(`user:${user.id}`, JSON.stringify(user), 'EX', 3600);
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
