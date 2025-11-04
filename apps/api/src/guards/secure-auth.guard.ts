import { SetMetadata, CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { SecurityLoggingService } from '../security/security-logging.service';
import { Request } from 'express';

// Authentication levels
export enum AuthLevel {
  PUBLIC = 'public',
  USER = 'user',
  ADMIN = 'admin',
  SYSTEM = 'system'
}

// Rate limit tiers
export enum RateLimitTier {
  PUBLIC = 'public',
  AUTH = 'auth',
  API = 'api',
  ADMIN = 'admin',
  HEALTH = 'health'
}

// Security levels
export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Metadata keys
export const AUTH_LEVEL_KEY = 'authLevel';
export const RATE_LIMIT_KEY = 'rateLimit';
export const SECURITY_LEVEL_KEY = 'securityLevel';
export const REQUIRE_SSL_KEY = 'requireSSL';
export const AUDIT_LOG_KEY = 'auditLog';
export const SENSITIVE_DATA_KEY = 'sensitiveData';

/**
 * Require specific authentication level
 */
export function RequireAuthLevel(level: AuthLevel) {
  return SetMetadata(AUTH_LEVEL_KEY, level);
}

/**
 * Apply rate limiting with specific tier
 */
export function RateLimitTier(tier: RateLimitTier) {
  return SetMetadata(RATE_LIMIT_KEY, tier);
}

/**
 * Set security level for endpoint
 */
export function SecurityLevel(level: SecurityLevel) {
  return SetMetadata(SECURITY_LEVEL_KEY, level);
}

/**
 * Require SSL/HTTPS
 */
export function RequireSSL() {
  return SetMetadata(REQUIRE_SSL_KEY, true);
}

/**
 * Log this endpoint for audit purposes
 */
export function AuditLog() {
  return SetMetadata(AUDIT_LOG_KEY, true);
}

/**
 * Endpoint handles sensitive data
 */
export function SensitiveData() {
  return SetMetadata(SENSITIVE_DATA_KEY, true);
}

/**
 * Secure guard that validates authentication and applies security policies
 */
@Injectable()
export class SecureAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private securityLogging: SecurityLoggingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const className = context.getClass().name;

    // Get security requirements
    const authLevel = this.reflector.get<AuthLevel>(AUTH_LEVEL_KEY, handler) || AuthLevel.PUBLIC;
    const securityLevel = this.reflector.get<SecurityLevel>(SECURITY_LEVEL_KEY, handler) || SecurityLevel.LOW;
    const requireSSL = this.reflector.get<boolean>(REQUIRE_SSL_KEY, handler) || false;
    const auditLog = this.reflector.get<boolean>(AUDIT_LOG_KEY, handler) || false;
    const sensitiveData = this.reflector.get<boolean>(SENSITIVE_DATA_KEY, handler) || false;

    // Check SSL requirement
    if (requireSSL && !this.isSecure(request)) {
      throw new UnauthorizedException('SSL/HTTPS required for this endpoint');
    }

    // Handle public endpoints
    if (authLevel === AuthLevel.PUBLIC) {
      this.logEndpointAccess(request, 'PUBLIC_ACCESS', { auditLog, sensitiveData });
      return true;
    }

    // Validate authentication for protected endpoints
    const user = await this.validateAuthentication(request);
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check authorization level
    if (!this.checkAuthorizationLevel(user, authLevel)) {
      this.securityLogging.logAuthZEvent('access_denied', {
        userId: user.id,
        ip: this.getClientIP(request),
        endpoint: request.path,
        method: request.method,
        success: false,
        reason: `Insufficient auth level: ${authLevel}`,
      });
      throw new ForbiddenException(`Insufficient permissions for ${authLevel} level access`);
    }

    // Add user info to request
    request.user = user;

    // Log endpoint access
    this.logEndpointAccess(request, 'PROTECTED_ACCESS', { 
      auditLog, 
      sensitiveData, 
      user,
      securityLevel 
    });

    return true;
  }

  /**
   * Validate JWT token and extract user information
   */
  private async validateAuthentication(request: Request): Promise<any> {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      this.securityLogging.logAuthEvent('auth_failure', {
        ip: this.getClientIP(request),
        userAgent: request.headers['user-agent'],
        method: request.method,
        endpoint: request.path,
        success: false,
        reason: 'Invalid or expired token',
        metadata: { error: error.message },
      });
      return null;
    }
  }

  /**
   * Check if user has required authorization level
   */
  private checkAuthorizationLevel(user: any, requiredLevel: AuthLevel): boolean {
    switch (requiredLevel) {
      case AuthLevel.SYSTEM:
        return user.roles?.includes('system') || user.permissions?.includes('system:access');
      
      case AuthLevel.ADMIN:
        return user.roles?.includes('admin') || user.permissions?.includes('admin:access') || user.roles?.includes('system');
      
      case AuthLevel.USER:
        return true; // Any authenticated user
      
      case AuthLevel.PUBLIC:
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Check if request is over SSL/HTTPS
   */
  private isSecure(request: Request): boolean {
    return request.secure || 
           request.headers['x-forwarded-proto'] === 'https' ||
           process.env.NODE_ENV !== 'production'; // Allow HTTP in development
  }

  /**
   * Log endpoint access
   */
  private logEndpointAccess(request: Request, event: string, details: any): void {
    this.securityLogging.logApiAccess(request.method, request.path, {
      requestId: request.requestId,
      userId: request.user?.id,
      ip: this.getClientIP(request),
      userAgent: request.headers['user-agent'],
      statusCode: 200, // Will be updated by response
      details: {
        event,
        ...details,
      },
    });
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: Request): string {
    return (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           request.headers['x-real-ip'] as string ||
           request.connection.remoteAddress ||
           request.ip ||
           'unknown';
  }
}

/**
 * Decorator for JWT authentication
 */
export function JwtAuth() {
  return RequireAuthLevel(AuthLevel.USER);
}

/**
 * Decorator for admin-only endpoints
 */
export function AdminOnly() {
  return RequireAuthLevel(AuthLevel.ADMIN);
}

/**
 * Decorator for system-level endpoints
 */
export function SystemOnly() {
  return RequireAuthLevel(AuthLevel.SYSTEM);
}

/**
 * Decorator for high-security endpoints
 */
export function HighSecurity() {
  return SecurityLevel(SecurityLevel.HIGH);
}

/**
 * Decorator for critical security endpoints
 */
export function CriticalSecurity() {
  return SecurityLevel(SecurityLevel.CRITICAL);
}