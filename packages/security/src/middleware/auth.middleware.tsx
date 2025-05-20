import { Request, Response, NextFunction } from 'express';

interface User {
  id: string;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
      roles: ['user']
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;