import { User } from './User.js';
export declare class AuthSession {
  id: string;
  user: User;
  userId: string;
  token: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}
