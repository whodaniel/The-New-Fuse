// Express Request type augmentation for custom properties
import 'express';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email?: string;
      roles?: string[];
      permissions?: string[];
      iat?: number;
      exp?: number;
    };
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

// Express session augmentation
declare module 'express-session' {
  interface SessionData {
    user_id?: string;
    user?: any;
  }
}
