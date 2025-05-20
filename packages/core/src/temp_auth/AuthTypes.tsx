import { z } from 'zod';

export interface AuthConfig {
  jwtSecret: string;
  tokenExpiration: number;
  refreshTokenExpiration: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number;
  };
}

export interface TokenPayload {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface AuthSession {
  id: string;
  userId: string;
  deviceInfo: {
    type: string;
    os: string;
    browser: string;
    ip: string;
  };
  issuedAt: Date;
  lastActive: Date;
  expiresAt: Date;
  isRevoked: boolean;
}

export interface LoginAttempt {
  userId: string;
  timestamp: Date;
  success: boolean;
  ip: string;
  userAgent: string;
  error?: string;
}

export interface AuthEvent {
  type: AuthEventType;
  userId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export enum AuthEventType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  SESSION_REVOKED = 'SESSION_REVOKED',
  LOGIN_FAILED = 'LOGIN_FAILED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED'
}

export const AuthConfigSchema = z.object({
  jwtSecret: z.string(),
  tokenExpiration: z.number().positive(),
  refreshTokenExpiration: z.number().positive(),
  maxLoginAttempts: z.number().positive(),
  lockoutDuration: z.number().positive(),
  passwordPolicy: z.object({
    minLength: z.number().positive(),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSpecialChars: z.boolean(),
    maxAge: z.number().positive()
  })
});

export const TokenPayloadSchema = z.object({
  userId: z.string(),
  username: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  sessionId: z.string().uuid(),
  issuedAt: z.number(),
  expiresAt: z.number()
});

export const RefreshTokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  tokenId: z.string().uuid(),
  issuedAt: z.number(),
  expiresAt: z.number()
});

export const AuthSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  deviceInfo: z.object({
    type: z.string(),
    os: z.string(),
    browser: z.string(),
    ip: z.string()
  }),
  issuedAt: z.date(),
  lastActive: z.date(),
  expiresAt: z.date(),
  isRevoked: z.boolean()
});

export const LoginAttemptSchema = z.object({
  userId: z.string().uuid(),
  timestamp: z.date(),
  success: z.boolean(),
  ip: z.string(),
  userAgent: z.string(),
  error: z.string().optional()
});

export const AuthEventSchema = z.object({
  type: z.nativeEnum(AuthEventType),
  userId: z.string().uuid(),
  timestamp: z.date(),
  metadata: z.record(z.any())
});
