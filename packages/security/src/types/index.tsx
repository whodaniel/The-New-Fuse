export * from './auth.js';
export * from './session.js';
export * from './utils.js';

export interface SecurityContext {
  userId: string;
  sessionId: string;
  roles: string[];
  permissions: string[];
  metadata: Record<string, any>;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  metadata: Record<string, any>;
  status: 'success' | 'failure';
  ipAddress?: string;
  userAgent?: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  statusCode?: number;
  headers?: boolean;
}

export interface EncryptionConfig {
  algorithm: string;
  secretKey: string;
  iv?: Buffer;
  encoding?: BufferEncoding;
}