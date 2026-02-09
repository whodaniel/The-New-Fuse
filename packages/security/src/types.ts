export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  success?: boolean;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface SecurityContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  permissions?: string[];
  roles?: string[];
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface SecurityConfig {
  jwtSecret: string;
  encryptionKey: string;
  sessionTimeout: number;
  rateLimit: RateLimitConfig;
  auditEnabled: boolean;
}