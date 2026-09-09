// Augment the shared namespace so Express and express-serve-static-core
// requests carry the same authenticated identity and middleware metadata.
import 'express';
import 'express-session';

declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      roles?: string[];
      permissions?: string[];
      iat?: number;
      exp?: number;
    }

    interface Request {
      user?: User;
      requestId?: string;
      timestamp?: string;
      clientIP?: string;
      userAgent?: string;
      securityFlags?: {
        isBot?: boolean;
        isSuspicious?: boolean;
        threatLevel?: 'low' | 'medium' | 'high' | 'critical';
      };
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    user_id?: string;
    user?: any;
  }
}
