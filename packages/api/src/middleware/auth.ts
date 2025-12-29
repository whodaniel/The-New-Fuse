import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        message: 'Internal server error: JWT secret is not configured.',
      });
    }

    const decoded = jwt.verify(token, secret) as DecodedToken;

    // Add user info to request object
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
    return;
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};
