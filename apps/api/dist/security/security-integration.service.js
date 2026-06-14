"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SecurityIntegrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const auth_policy_1 = require("../auth/auth-policy");
const api_endpoint_monitoring_service_1 = require("../security/api-endpoint-monitoring.service");
const enhanced_rate_limit_service_1 = require("../security/enhanced-rate-limit.service");
const security_logging_service_1 = require("../security/security-logging.service");
let SecurityIntegrationService = SecurityIntegrationService_1 = class SecurityIntegrationService {
    constructor(rateLimitService, securityLogging, monitoringService) {
        this.rateLimitService = rateLimitService;
        this.securityLogging = securityLogging;
        this.monitoringService = monitoringService;
        this.logger = new common_1.Logger(SecurityIntegrationService_1.name);
    }
    /**
     * Comprehensive security check for all incoming requests
     */
    async performSecurityCheck(request) {
        const startTime = Date.now();
        const clientIP = this.getClientIP(request);
        const userAgent = request.headers['user-agent'] || 'unknown';
        try {
            // 1. Rate limiting check
            const rateLimitResult = await this.rateLimitService.checkRateLimitAuto(request);
            if (!rateLimitResult.allowed) {
                this.securityLogging.logRateLimit('limit_exceeded', {
                    ip: clientIP,
                    userAgent,
                    endpoint: request.path,
                    method: request.method,
                    limit: rateLimitResult.remaining,
                });
                return {
                    allowed: false,
                    reason: 'Rate limit exceeded',
                    rateLimitRemaining: 0,
                };
            }
            // 2. Security analysis
            const securityFlags = await this.performSecurityAnalysis(request);
            // 3. Log API access (statusCode is required, use 200 for successful requests)
            this.securityLogging.logApiAccess(request.method, request.path, {
                ip: clientIP,
                userAgent,
                userId: request.user?.id,
                requestId: request.requestId,
                statusCode: 200,
                responseTime: Date.now() - startTime,
            });
            // 4. Update monitoring (method, endpoint, statusCode, responseTime, userId?, ip?)
            this.monitoringService.recordRequest(request.method, request.path, 200, Date.now() - startTime, request.user?.id, clientIP);
            return {
                allowed: true,
                rateLimitRemaining: rateLimitResult.remaining,
                securityFlags,
            };
        }
        catch (error) {
            this.logger.error(`Security check failed: ${error.message}`, error.stack);
            // Log as suspicious_pattern since 'security_check_error' is not a valid violation type
            this.securityLogging.logSecurityViolation('suspicious_pattern', {
                ip: clientIP,
                endpoint: request.path,
                method: request.method,
                payload: { error: error.message },
                severity: 'medium',
            });
            return {
                allowed: false,
                reason: 'Security check failed',
            };
        }
    }
    /**
     * Validate JWT token and extract user information
     */
    async validateJWT(request) {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.substring(7);
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret || secret.length < 32) {
                throw new Error('JWT_SECRET must be provided and be at least 32 characters long');
            }
            // Import JWT service dynamically to avoid circular dependencies
            const { JwtService } = await Promise.resolve().then(() => __importStar(require('@nestjs/jwt')));
            const jwtService = new JwtService({
                secret: secret,
            });
            const payload = await jwtService.verifyAsync(token);
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
     * Check authorization level for user
     */
    checkAuthorizationLevel(user, requiredLevel) {
        return (0, auth_policy_1.hasAuthorizationLevel)(user, requiredLevel);
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
    /**
     * Perform security analysis on request
     */
    async performSecurityAnalysis(request) {
        const flags = {
            isBot: this.detectBot(request),
            isSuspicious: false,
            threatLevel: 'low',
        };
        // Check for suspicious patterns
        const userAgent = request.headers['user-agent'] || '';
        const path = request.path || '';
        // Suspicious patterns
        const suspiciousPatterns = [
            /(\<|%3C)script/i, // XSS attempts
            /union.*select/i, // SQL injection
            /\.\.\//i, // Path traversal
            /etc\/passwd/i, // File inclusion
        ];
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(userAgent) ||
                pattern.test(path) ||
                pattern.test(JSON.stringify(request.body))) {
                flags.isSuspicious = true;
                flags.threatLevel = 'medium';
                break;
            }
        }
        // High threat level indicators
        const highThreatPatterns = [/sqlmap/i, /nikto/i, /nessus/i, /burp/i];
        for (const pattern of highThreatPatterns) {
            if (pattern.test(userAgent) || pattern.test(path)) {
                flags.isSuspicious = true;
                flags.threatLevel = 'high';
                break;
            }
        }
        return flags;
    }
    /**
     * Detect if request is from a bot
     */
    detectBot(request) {
        const userAgent = (request.headers['user-agent'] || '').toLowerCase();
        const botPatterns = [
            'bot',
            'crawler',
            'spider',
            'scraper',
            'curl',
            'wget',
            'python',
            'requests',
            'http',
            'scanner',
            'scan',
        ];
        return botPatterns.some((pattern) => userAgent.includes(pattern));
    }
    /**
     * Clean up expired data
     */
    cleanup() {
        this.rateLimitService.cleanup();
    }
};
exports.SecurityIntegrationService = SecurityIntegrationService;
exports.SecurityIntegrationService = SecurityIntegrationService = SecurityIntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [enhanced_rate_limit_service_1.EnhancedRateLimitService,
        security_logging_service_1.SecurityLoggingService,
        api_endpoint_monitoring_service_1.ApiEndpointMonitoringService])
], SecurityIntegrationService);
//# sourceMappingURL=security-integration.service.js.map