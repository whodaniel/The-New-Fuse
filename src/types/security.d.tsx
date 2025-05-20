import { Session, SessionData } from "express-session";

// Add missing types from security module
export interface AuthSession extends Session, Partial<SessionData> {
  userId?: string;
  authMethod?: string;
  source?: string;
  device?: string;
  ip?: string;
  userAgent?: string;
  authenticated?: boolean;
  expiresAt?: Date;
}

export interface SecurityConfig {
  // Define the missing security configuration interface
  authMethods: string[];
  tokenExpiration: number;
  sessionExpiration: number;
  passwordPolicy: {
    minLength: number;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    requireUppercase: boolean;
    requireLowercase: boolean;
  };
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  // Add other security config properties as needed
}

// Add missing WebSocketError type
export interface WebSocketError extends Error {
  code: string;
  reason?: string;
}
