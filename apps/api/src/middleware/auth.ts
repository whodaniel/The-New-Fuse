import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler.js';

/**
 * Authentication middleware
 * Verifies that the user is authenticated before proceeding
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    next(new ApiError(401, 'Unauthorized: No token provided'));
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    next();
  } catch (error) {
    next(new ApiError(401, 'Unauthorized: Invalid token'));
  }
}
