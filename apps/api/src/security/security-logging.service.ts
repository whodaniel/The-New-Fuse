import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export interface SecurityLogEntry {
  timestamp: string;
  level: string;
  message: string;
  category: 'authentication' | 'authorization' | 'rate_limit' | 'input_validation' | 'api_access' | 'security_violation';
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  details?: any;
}

@Injectable()
export class SecurityLoggingService {
  private readonly logger: winston.Logger;
  private readonly securityLogger: winston.Logger;

  constructor(private configService: ConfigService) {
    // Main application logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new (winston.transports as any).DailyRotateFile({
          filename: 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });

    // Dedicated security logger
    this.securityLogger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new (winston.transports as any).DailyRotateFile({
          filename: 'logs/security-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
    });
  }

  /**
   * Log authentication events
   */
  logAuthEvent(
    event: 'login' | 'logout' | 'token_refresh' | 'auth_failure' | 'auth_bypass_attempt',
    details: {
      userId?: string;
      ip?: string;
      userAgent?: string;
      method?: string;
      endpoint?: string;
      success: boolean;
      reason?: string;
      metadata?: any;
    }
  ): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      level: details.success ? 'info' : 'warn',
      message: `Authentication ${event}`,
      category: 'authentication',
      userId: details.userId,
      ip: details.ip,
      userAgent: details.userAgent,
      method: details.method,
      endpoint: details.endpoint,
      success: details.success,
      details: {
        ...details,
        event,
      },
    };

    this.securityLogger.warn('AUTH EVENT', entry);
  }

  /**
   * Log authorization events
   */
  logAuthZEvent(
    event: 'access_granted' | 'access_denied' | 'privilege_escalation_attempt',
    details: {
      userId?: string;
      ip?: string;
      userAgent?: string;
      method?: string;
      endpoint?: string;
      resource?: string;
      permissions?: string[];
      success: boolean;
      reason?: string;
    }
  ): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      level: details.success ? 'info' : 'error',
      message: `Authorization ${event}`,
      category: 'authorization',
      userId: details.userId,
      ip: details.ip,
      userAgent: details.userAgent,
      method: details.method,
      endpoint: details.endpoint,
      details: {
        ...details,
        event,
      },
    };

    this.securityLogger.warn('AUTHZ EVENT', entry);
  }

  /**
   * Log rate limiting events
   */
  logRateLimit(
    action: 'limit_exceeded' | 'ip_blocked' | 'quota_exceeded',
    details: {
      ip?: string;
      userAgent?: string;
      endpoint?: string;
      method?: string;
      limit?: number;
      current?: number;
      window?: number;
      reason?: string;
    }
  ): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: `Rate limit ${action}`,
      category: 'rate_limit',
      ip: details.ip,
      userAgent: details.userAgent,
      method: details.method,
      endpoint: details.endpoint,
      details,
    };

    this.securityLogger.warn('RATE LIMIT', entry);
  }

  /**
   * Log input validation failures
   */
  logInputValidation(
    endpoint: string,
    method: string,
    details: {
      ip?: string;
      userId?: string;
      field?: string;
      value?: any;
      reason?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      level: details.severity === 'critical' || details.severity === 'high' ? 'error' : 'warn',
      message: `Input validation failed`,
      category: 'input_validation',
      endpoint,
      method,
      userId: details.userId,
      ip: details.ip,
      details,
    };

    this.securityLogger.warn('INPUT VALIDATION', entry);
  }

  /**
   * Log API access events
   */
  logApiAccess(
    method: string,
    endpoint: string,
    details: {
      requestId?: string;
      userId?: string;
      ip?: string;
      userAgent?: string;
      statusCode: number;
      responseTime?: number;
      bytesSent?: number;
    }
  ): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      level: details.statusCode >= 400 ? 'warn' : 'info',
      message: `API access: ${method} ${endpoint}`,
      category: 'api_access',
      requestId: details.requestId,
      userId: details.userId,
      ip: details.ip,
      userAgent: details.userAgent,
      method,
      endpoint,
      statusCode: details.statusCode,
      details,
    };

    this.securityLogger.info('API ACCESS', entry);
  }

  /**
   * Log security violations
   */
  logSecurityViolation(
    violation: 'sql_injection' | 'xss_attempt' | 'path_traversal' | 'unauthorized_access' | 'suspicious_pattern',
    details: {
      ip?: string;
      userId?: string;
      endpoint?: string;
      method?: string;
      payload?: any;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      action?: 'blocked' | 'logged' | 'quarantined';
    }
  ): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Security violation: ${violation}`,
      category: 'security_violation',
      ip: details.ip,
      userId: details.userId,
      endpoint: details.endpoint,
      method: details.method,
      details: {
        ...details,
        violation,
      },
    };

    this.securityLogger.error('SECURITY VIOLATION', entry);
  }

  /**
   * Get security metrics for monitoring
   */
  getSecurityMetrics(): any {
    return {
      timestamp: new Date().toISOString(),
      categories: {
        authentication: 'logged',
        authorization: 'logged',
        rateLimit: 'logged',
        inputValidation: 'logged',
        apiAccess: 'logged',
        securityViolations: 'logged',
      },
      retention: '30 days',
      logLevel: 'info+',
    };
  }
}