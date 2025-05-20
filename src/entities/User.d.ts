import { Pipeline } from './Pipeline.js';
import { AuthSession } from './AuthSession.js';
import { LoginAttempt } from './LoginAttempt.js';
import { AuthEvent } from './AuthEvent.js';
export declare class User {
  id: string;
  email: string;
  password?: string;
  name?: string;
  pipelines?: Pipeline[];
  sessions?: AuthSession[];
  loginAttempts?: LoginAttempt[];
  authEvents?: AuthEvent[];
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
