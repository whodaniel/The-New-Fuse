import { Request, Response, NextFunction } from 'express';
import { AuthUser } from '../services/SessionManager';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    // Token validation would go here
    // For now just add a mock user
    req.user = {
      id: '123',
      email: 'mock@example.com',
      username: 'mockuser',
      roles: ['user'],
      permissions: [],
    };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;