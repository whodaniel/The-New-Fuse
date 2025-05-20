import { User } from './User.js';
export declare class AuthEvent {
  id: string;
  user?: User;
  userId?: string;
  type: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}
