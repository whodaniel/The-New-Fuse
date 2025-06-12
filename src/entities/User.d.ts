import { Pipeline } from './Pipeline.tsx';
import { AuthSession } from './AuthSession.tsx';
import { LoginAttempt } from './LoginAttempt.tsx';
import { AuthEvent } from './AuthEvent.tsx';
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
