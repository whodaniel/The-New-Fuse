import { User } from './User.js';
export declare class LoginAttempt {
  id: string;
  user?: User;
  userId?: string;
  email: string;
  success: boolean;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}
