import { Request, Response, NextFunction } from 'express';
import { sessionManager, Session, AuthUser } from '../services/SessionManager.js';

export interface RequestWithSession extends Request {
  session?: Session;
  user?: AuthUser;
}

export const sessionMiddleware = (req: RequestWithSession, res: Response, next: NextFunction) => {
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
  
  if (sessionId) {
    const session = sessionManager.getSession(sessionId);
    if (session) {
      req.session = session;
      // Here we would typically load the user from the database
      // For this example, we'll just create a mock user
      req.user = {
        id: session.userId,
        email: 'user@example.com',
        roles: ['user']
      };
    }
  }
  
  next();
};
