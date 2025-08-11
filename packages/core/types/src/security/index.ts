// Security types for The New Fuse application

export interface SecurityConfig {
  encryptionKey?: string;
  jwtSecret?: string;
  sessionTimeout?: number;
  rateLimiting?: RateLimitConfig;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  token?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityAuditEvent {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
}

export interface EncryptionOptions {
  algorithm?: string;
  keyLength?: number;
  ivLength?: number;
}

export interface SessionData {
  userId: string;
  roles: string[];
  permissions: string[];
  expiresAt: Date;
  metadata?: Record<string, any>;
}

// Security error types
export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string = 'SECURITY_ERROR',
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class AuthenticationError extends SecurityError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends SecurityError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

// Export constants
export const SECURITY_CONSTANTS = {
  DEFAULT_SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  DEFAULT_JWT_EXPIRY: '24h',
  DEFAULT_ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  DEFAULT_KEY_LENGTH: 32,
  DEFAULT_IV_LENGTH: 16,
} as const;

export const PERMISSIONS = {
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  ADMIN_ACCESS: 'admin:access',
  SYSTEM_CONFIG: 'system:config',
} as const;

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SYSTEM: 'system',
} as const;