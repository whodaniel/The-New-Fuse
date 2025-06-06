import { z } from 'zod';

// User authentication related types
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
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

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  issuedAt: number;
  expiresAt: number;
}

// Zod schemas for validation
export const UserCredentialsSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  email: z.string().email().optional()
});

export const TokenPayloadSchema = z.object({
  userId: z.string(),
  username: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  sessionId: z.string(),
  issuedAt: z.number(),
  expiresAt: z.number()
});

// Type inference from Zod schemas
export type UserCredentials = z.infer<typeof UserCredentialsSchema>;
export type ValidatedTokenPayload = z.infer<typeof TokenPayloadSchema>;

// Authentication results
export interface AuthResult {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
}

// Permission and role types
export interface Permission {
  resource: string;
  action: string;
  attributes?: string[];
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}