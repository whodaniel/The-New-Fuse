import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { SecurityLoggingService } from '../security/security-logging.service';
export declare enum AuthLevel {
    PUBLIC = "public",
    USER = "user",
    ADMIN = "admin",
    SYSTEM = "system"
}
export declare enum RateLimitTier {
    PUBLIC = "public",
    AUTH = "auth",
    API = "api",
    ADMIN = "admin",
    HEALTH = "health"
}
export declare enum SecurityLevelEnum {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export type SecurityLevel = SecurityLevelEnum;
export declare const AUTH_LEVEL_KEY = "authLevel";
export declare const RATE_LIMIT_KEY = "rateLimit";
export declare const SECURITY_LEVEL_KEY = "securityLevel";
export declare const REQUIRE_SSL_KEY = "requireSSL";
export declare const AUDIT_LOG_KEY = "auditLog";
export declare const SENSITIVE_DATA_KEY = "sensitiveData";
/**
 * Require specific authentication level
 */
export declare function RequireAuthLevel(level: AuthLevel): import("@nestjs/common").CustomDecorator<string>;
/**
 * Apply rate limiting with specific tier
 */
export declare function SetRateLimitTier(tier: RateLimitTier): import("@nestjs/common").CustomDecorator<string>;
/**
 * Set security level for endpoint
 */
export declare function SetSecurityLevel(level: SecurityLevelEnum): import("@nestjs/common").CustomDecorator<string>;
/**
 * Require SSL/HTTPS
 */
export declare function RequireSSL(): import("@nestjs/common").CustomDecorator<string>;
/**
 * Log this endpoint for audit purposes
 */
export declare function AuditLog(): import("@nestjs/common").CustomDecorator<string>;
/**
 * Endpoint handles sensitive data
 */
export declare function SensitiveData(): import("@nestjs/common").CustomDecorator<string>;
/**
 * Secure guard that validates authentication and applies security policies
 */
export declare class SecureAuthGuard implements CanActivate {
    private reflector;
    private jwtService;
    private securityLogging;
    constructor(reflector: Reflector, jwtService: JwtService, securityLogging: SecurityLoggingService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    /**
     * Validate JWT token and extract user information
     */
    private validateAuthentication;
    /**
     * Check if user has required authorization level
     */
    private checkAuthorizationLevel;
    /**
     * Check if request is over SSL/HTTPS
     */
    private isSecure;
    /**
     * Log endpoint access
     */
    private logEndpointAccess;
    /**
     * Get client IP address
     */
    private getClientIP;
}
/**
 * Decorator for JWT authentication
 */
export declare function JwtAuth(): import("@nestjs/common").CustomDecorator<string>;
/**
 * Decorator for admin-only endpoints
 */
export declare function AdminOnly(): import("@nestjs/common").CustomDecorator<string>;
/**
 * Decorator for system-level endpoints
 */
export declare function SystemOnly(): import("@nestjs/common").CustomDecorator<string>;
/**
 * Decorator for high-security endpoints
 */
export declare function HighSecurity(): import("@nestjs/common").CustomDecorator<string>;
/**
 * Decorator for critical security endpoints
 */
export declare function CriticalSecurity(): import("@nestjs/common").CustomDecorator<string>;
//# sourceMappingURL=secure-auth.guard.d.ts.map