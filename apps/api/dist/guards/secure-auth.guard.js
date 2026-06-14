"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureAuthGuard = exports.SENSITIVE_DATA_KEY = exports.AUDIT_LOG_KEY = exports.REQUIRE_SSL_KEY = exports.SECURITY_LEVEL_KEY = exports.RATE_LIMIT_KEY = exports.AUTH_LEVEL_KEY = exports.SecurityLevelEnum = exports.RateLimitTier = exports.AuthLevel = void 0;
exports.RequireAuthLevel = RequireAuthLevel;
exports.SetRateLimitTier = SetRateLimitTier;
exports.SetSecurityLevel = SetSecurityLevel;
exports.RequireSSL = RequireSSL;
exports.AuditLog = AuditLog;
exports.SensitiveData = SensitiveData;
exports.JwtAuth = JwtAuth;
exports.AdminOnly = AdminOnly;
exports.SystemOnly = SystemOnly;
exports.HighSecurity = HighSecurity;
exports.CriticalSecurity = CriticalSecurity;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const auth_policy_1 = require("../auth/auth-policy");
const security_logging_service_1 = require("../security/security-logging.service");
// Authentication levels
var AuthLevel;
(function (AuthLevel) {
    AuthLevel["PUBLIC"] = "public";
    AuthLevel["USER"] = "user";
    AuthLevel["ADMIN"] = "admin";
    AuthLevel["SYSTEM"] = "system";
})(AuthLevel || (exports.AuthLevel = AuthLevel = {}));
// Rate limit tiers
var RateLimitTier;
(function (RateLimitTier) {
    RateLimitTier["PUBLIC"] = "public";
    RateLimitTier["AUTH"] = "auth";
    RateLimitTier["API"] = "api";
    RateLimitTier["ADMIN"] = "admin";
    RateLimitTier["HEALTH"] = "health";
})(RateLimitTier || (exports.RateLimitTier = RateLimitTier = {}));
// Security levels
var SecurityLevelEnum;
(function (SecurityLevelEnum) {
    SecurityLevelEnum["LOW"] = "low";
    SecurityLevelEnum["MEDIUM"] = "medium";
    SecurityLevelEnum["HIGH"] = "high";
    SecurityLevelEnum["CRITICAL"] = "critical";
})(SecurityLevelEnum || (exports.SecurityLevelEnum = SecurityLevelEnum = {}));
// Metadata keys
exports.AUTH_LEVEL_KEY = 'authLevel';
exports.RATE_LIMIT_KEY = 'rateLimit';
exports.SECURITY_LEVEL_KEY = 'securityLevel';
exports.REQUIRE_SSL_KEY = 'requireSSL';
exports.AUDIT_LOG_KEY = 'auditLog';
exports.SENSITIVE_DATA_KEY = 'sensitiveData';
/**
 * Require specific authentication level
 */
function RequireAuthLevel(level) {
    return (0, common_1.SetMetadata)(exports.AUTH_LEVEL_KEY, level);
}
/**
 * Apply rate limiting with specific tier
 */
function SetRateLimitTier(tier) {
    return (0, common_1.SetMetadata)(exports.RATE_LIMIT_KEY, tier);
}
/**
 * Set security level for endpoint
 */
function SetSecurityLevel(level) {
    return (0, common_1.SetMetadata)(exports.SECURITY_LEVEL_KEY, level);
}
/**
 * Require SSL/HTTPS
 */
function RequireSSL() {
    return (0, common_1.SetMetadata)(exports.REQUIRE_SSL_KEY, true);
}
/**
 * Log this endpoint for audit purposes
 */
function AuditLog() {
    return (0, common_1.SetMetadata)(exports.AUDIT_LOG_KEY, true);
}
/**
 * Endpoint handles sensitive data
 */
function SensitiveData() {
    return (0, common_1.SetMetadata)(exports.SENSITIVE_DATA_KEY, true);
}
/**
 * Secure guard that validates authentication and applies security policies
 */
let SecureAuthGuard = class SecureAuthGuard {
    constructor(reflector, jwtService, securityLogging) {
        this.reflector = reflector;
        this.jwtService = jwtService;
        this.securityLogging = securityLogging;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const handler = context.getHandler();
        const className = context.getClass().name;
        // Get security requirements
        const authLevel = this.reflector.getAllAndOverride(exports.AUTH_LEVEL_KEY, [handler, context.getClass()]) ||
            AuthLevel.PUBLIC;
        const securityLevel = this.reflector.getAllAndOverride(exports.SECURITY_LEVEL_KEY, [
            handler,
            context.getClass(),
        ]) || SecurityLevelEnum.LOW;
        const requireSSL = this.reflector.getAllAndOverride(exports.REQUIRE_SSL_KEY, [handler, context.getClass()]) ||
            false;
        const auditLog = this.reflector.getAllAndOverride(exports.AUDIT_LOG_KEY, [handler, context.getClass()]) ||
            false;
        const sensitiveData = this.reflector.getAllAndOverride(exports.SENSITIVE_DATA_KEY, [handler, context.getClass()]) ||
            false;
        // Check SSL requirement
        if (requireSSL && !this.isSecure(request)) {
            throw new common_1.UnauthorizedException('SSL/HTTPS required for this endpoint');
        }
        // Handle public endpoints
        if (authLevel === AuthLevel.PUBLIC) {
            this.logEndpointAccess(request, 'PUBLIC_ACCESS', { auditLog, sensitiveData });
            return true;
        }
        // Validate authentication for protected endpoints
        const user = await this.validateAuthentication(request);
        if (!user) {
            throw new common_1.UnauthorizedException('Authentication required');
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
            throw new common_1.ForbiddenException(`Insufficient permissions for ${authLevel} level access`);
        }
        // Add user info to request
        request.user = user;
        // Log endpoint access
        this.logEndpointAccess(request, 'PROTECTED_ACCESS', {
            auditLog,
            sensitiveData,
            user,
            securityLevel,
        });
        return true;
    }
    /**
     * Validate JWT token and extract user information
     */
    async validateAuthentication(request) {
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
        }
        catch (error) {
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
    checkAuthorizationLevel(user, requiredLevel) {
        return (0, auth_policy_1.hasAuthorizationLevel)(user, requiredLevel);
    }
    /**
     * Check if request is over SSL/HTTPS
     */
    isSecure(request) {
        return (request.secure ||
            request.headers['x-forwarded-proto'] === 'https' ||
            process.env.NODE_ENV !== 'production'); // Allow HTTP in development
    }
    /**
     * Log endpoint access
     */
    logEndpointAccess(request, event, details) {
        this.securityLogging.logApiAccess(request.method, request.path, {
            requestId: request.requestId,
            userId: request.user?.id,
            ip: this.getClientIP(request),
            userAgent: request.headers['user-agent'],
            statusCode: 200, // Will be updated by response
        });
    }
    /**
     * Get client IP address
     */
    getClientIP(request) {
        return (request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            request.headers['x-real-ip'] ||
            request.connection.remoteAddress ||
            request.ip ||
            'unknown');
    }
};
exports.SecureAuthGuard = SecureAuthGuard;
exports.SecureAuthGuard = SecureAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService,
        security_logging_service_1.SecurityLoggingService])
], SecureAuthGuard);
/**
 * Decorator for JWT authentication
 */
function JwtAuth() {
    return RequireAuthLevel(AuthLevel.USER);
}
/**
 * Decorator for admin-only endpoints
 */
function AdminOnly() {
    return RequireAuthLevel(AuthLevel.ADMIN);
}
/**
 * Decorator for system-level endpoints
 */
function SystemOnly() {
    return RequireAuthLevel(AuthLevel.SYSTEM);
}
/**
 * Decorator for high-security endpoints
 */
function HighSecurity() {
    return SetSecurityLevel(SecurityLevelEnum.HIGH);
}
/**
 * Decorator for critical security endpoints
 */
function CriticalSecurity() {
    return SetSecurityLevel(SecurityLevelEnum.CRITICAL);
}
//# sourceMappingURL=secure-auth.guard.js.map