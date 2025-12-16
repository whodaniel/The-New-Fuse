import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';

/**
 * Authentication middleware
 * Verifies that the user is authenticated before proceeding
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];

  // In development, allow test-token to bypass auth
  if (
    (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') &&
    token === 'test-token'
  ) {
    // Add mock user for test-token
    (req as any).user = {
      id: 'test-user-id',
      email: 'test@example.com',
      roles: ['user'],
    };
    next();
    return;
  }

  if (!token) {
    next(new ApiError(401, 'Unauthorized: No token provided'));
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is not defined');
      }
      console.warn('JWT_SECRET is not defined, using unsafe default for development');
      // Only for non-production to avoid crashing during local setup if env is missing
    }

    const decoded = jwt.verify(token, secret || 'your-secret-key');
    (req as any).user = decoded;
    next();
  } catch (error) {
    next(new ApiError(401, 'Unauthorized: Invalid token'));
  }
}
