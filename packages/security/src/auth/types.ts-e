import { Request } from 'express';

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  lastLogin?: Date;
  isLocked: boolean;
  loginAttempts: number;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

export interface AuthToken {
  token: string;
  expiresIn: number;
  type: 'access' | 'refresh';
}

export interface LoginResult {
  user: User;
  token: AuthToken;
  refreshToken: AuthToken;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  bcryptSaltRounds: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface TokenPayload {
  sub: string;
  type: string;
  roles: string[];
  permissions: string[];
  exp?: number;
  iat?: number;
}

export interface AuthenticationResult {
  success: boolean;
  user?: User;
  token?: AuthToken;
  error?: string;
}

export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
  used: boolean;
}