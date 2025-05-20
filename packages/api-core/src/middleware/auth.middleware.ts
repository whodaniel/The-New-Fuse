import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      [key: string]: any;
    }
  }
}

/**
 * Authentication middleware
 * Verifies the JWT token in the Authorization header and adds the user to the request object
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'Invalid authorization header format' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'default-secret-for-development';
    const decoded = jwt.verify(token, secret) as { id: string; email: string };
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ error: `Authentication failed: ${error.message}` });
    } else {
      res.status(401).json({ error: 'Authentication failed: Unknown error' });
    }
  }
};