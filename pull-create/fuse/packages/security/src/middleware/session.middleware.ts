import { NextFunction, Request, Response } from 'express';
import { AuthUser, sessionManager } from '../services/SessionManager';

export interface RequestWithSession extends Request {
  user?: AuthUser;
}

export const sessionMiddleware = (req: RequestWithSession, res: Response, next: NextFunction) => {
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

  if (sessionId) {
    const session = sessionManager.getSession(sessionId);
    if (session) {
      // req.session = session; // This line causes a type conflict with express-session
      // Here we would typically load the user from the database
      // For this example, we'll just create a mock user
      req.user = {
        id: session.userId,
        email: 'user@example.com',
        roles: ['user'],
      };
    }
  }

  next();
};
