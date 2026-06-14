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
var EnhancedSecurityMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedSecurityMiddleware = void 0;
const common_1 = require("@nestjs/common");
const security_logging_service_1 = require("../security/security-logging.service");
const enhanced_rate_limit_service_1 = require("../security/enhanced-rate-limit.service");
const input_sanitization_service_1 = require("../security/input-sanitization.service");
const crypto = __importStar(require("node:crypto"));
let EnhancedSecurityMiddleware = EnhancedSecurityMiddleware_1 = class EnhancedSecurityMiddleware {
    constructor(securityLogging, rateLimitService, inputSanitization) {
        this.securityLogging = securityLogging;
        this.rateLimitService = rateLimitService;
        this.inputSanitization = inputSanitization;
        this.logger = new common_1.Logger(EnhancedSecurityMiddleware_1.name);
    }
    async use(req, res, next) {
        const startTime = Date.now();
        // Generate unique request ID
        req.requestId = this.generateRequestId();
        req.timestamp = new Date().toISOString();
        req.clientIP = this.getClientIP(req);
        req.userAgent = req.headers['user-agent'] || 'unknown';
        // Add request tracking headers
        res.setHeader('X-Request-ID', req.requestId);
        res.setHeader('X-Timestamp', req.timestamp);
        res.setHeader('X-Client-IP', req.clientIP);
        res.setHeader('X-Response-Time', '');
        // Security analysis
        const securityAnalysis = await this.performSecurityAnalysis(req);
        req.securityFlags = securityAnalysis;
        // Enhanced rate limiting with tier detection
        await this.enforceRateLimiting(req, res);
        // Input sanitization and validation
        this.sanitizeAndValidateInput(req);
        // Security headers injection
        this.injectSecurityHeaders(res);
        // Log API access
        const originalSend = res.send.bind(res);
        const originalJson = res.json.bind(res);
        // Intercept response to log and sanitize
        res.send = (body) => {
            this.logApiResponse(req, res, startTime, body);
            return originalSend(body);
        };
        res.json = (body) => {
            this.logApiResponse(req, res, startTime, body);
            return originalJson(body);
        };
        // Handle response end
        const originalEnd = res.end.bind(res);
        res.end = (chunk, encoding) => {
            const responseTime = Date.now() - startTime;
            res.setHeader('X-Response-Time', `${responseTime}ms`);
            // Log slow requests
            if (responseTime > 5000) {
                this.logger.warn(`Slow request detected: ${req.method} ${req.path} took ${responseTime}ms`);
            }
            return originalEnd(chunk, encoding);
        };
        // Continue to next middleware
        next();
    }
    /**
     * Perform comprehensive security analysis
     */
    async performSecurityAnalysis(req) {
        const flags = {
            isBot: this.detectBot(req),
            isSuspicious: false,
            threatLevel: 'low',
        };
        // Check for common attack patterns
        if (this.detectSQLInjection(req) || this.detectXSS(req) || this.detectPathTraversal(req)) {
            flags.isSuspicious = true;
            flags.threatLevel = 'high';
        }
        // Check request characteristics
        if (this.detectUnusualPattern(req)) {
            flags.threatLevel = 'medium';
        }
        // Log security violations
        if (flags.threatLevel === 'high') {
            this.securityLogging.logSecurityViolation('suspicious_pattern', {
                ip: req.clientIP,
                endpoint: req.path,
                method: req.method,
                payload: {
                    body: req.body,
                    query: req.query,
                    headers: this.sanitizeHeaders(req.headers),
                },
                severity: flags.threatLevel,
                action: 'blocked',
            });
        }
        return flags;
    }
    /**
     * Enforce rate limiting with enhanced rules
     */
    async enforceRateLimiting(req, res) {
        try {
            // Check if IP is blocked
            if (this.rateLimitService.isIPBlocked(req.clientIP || 'unknown')) {
                throw new common_1.UnauthorizedException('IP address temporarily blocked');
            }
            // Check rate limit
            const rateLimitResult = await this.rateLimitService.checkRateLimitAuto(req);
            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', rateLimitResult.allowed ? rateLimitResult.remaining + 1 : 0);
            res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
            res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
            if (!rateLimitResult.allowed) {
                throw new common_1.UnauthorizedException('Rate limit exceeded');
            }
        }
        catch (error) {
            this.securityLogging.logRateLimit('limit_exceeded', {
                ip: req.clientIP,
                userAgent: req.userAgent,
                endpoint: req.path,
                method: req.method,
                reason: error.message,
            });
            throw error;
        }
    }
    /**
     * Sanitize and validate input
     */
    sanitizeAndValidateInput(req) {
        try {
            // Sanitize query parameters
            if (req.query && typeof req.query === 'object') {
                Object.keys(req.query).forEach(key => {
                    const queryValue = req.query[key];
                    if (typeof queryValue === 'string') {
                        const sanitized = this.inputSanitization.sanitizeText(queryValue);
                        req.query[key] = sanitized;
                        // Log if sanitization changed the value
                        if (sanitized !== queryValue) {
                            this.securityLogging.logInputValidation(req.path, req.method, {
                                ip: req.clientIP,
                                field: `query.${key}`,
                                value: queryValue,
                                reason: 'Potentially malicious content detected',
                                severity: 'medium',
                            });
                        }
                    }
                });
            }
            // Sanitize body
            if (req.body && typeof req.body === 'object') {
                req.body = this.inputSanitization.sanitizeObject(req.body);
            }
            // Sanitize route parameters
            if (req.params && typeof req.params === 'object') {
                Object.keys(req.params).forEach(key => {
                    if (typeof req.params[key] === 'string') {
                        req.params[key] = this.inputSanitization.sanitizeText(req.params[key]);
                    }
                });
            }
        }
        catch (error) {
            this.securityLogging.logInputValidation(req.path, req.method, {
                ip: req.clientIP,
                reason: error.message,
                severity: 'high',
            });
            throw new common_1.BadRequestException('Invalid input data');
        }
    }
    /**
     * Inject comprehensive security headers
     */
    injectSecurityHeaders(res) {
        // Content Security Policy
        res.setHeader('Content-Security-Policy', "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self'; " +
            "connect-src 'self' wss: https:; " +
            "frame-src 'none'; " +
            "object-src 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'; " +
            "upgrade-insecure-requests;");
        // Additional security headers
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), fullscreen=(*), sync-xhr=(*)');
        // Remove server information
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
        // HSTS (HTTPS Strict Transport Security)
        if (process.env.NODE_ENV === 'production') {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }
    }
    /**
     * Log API response for monitoring
     */
    logApiResponse(req, res, startTime, body) {
        const responseTime = Date.now() - startTime;
        this.securityLogging.logApiAccess(req.method, req.path, {
            requestId: req.requestId,
            userId: req.user?.id,
            ip: req.clientIP,
            userAgent: req.userAgent,
            statusCode: res.statusCode,
            responseTime,
            bytesSent: body ? JSON.stringify(body).length : 0,
        });
    }
    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    }
    /**
     * Get client IP address
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.ip ||
            'unknown';
    }
    /**
     * Detect bot traffic
     */
    detectBot(req) {
        const userAgent = req.userAgent?.toLowerCase() || '';
        const botPatterns = [
            'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'java',
            'go-http-client', 'okhttp', 'libwww', 'httpclient', 'feedburner', 'googlebot'
        ];
        return botPatterns.some(pattern => userAgent.includes(pattern));
    }
    /**
     * Detect SQL injection patterns
     */
    detectSQLInjection(req) {
        const suspiciousPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|EXECUTE)\b)/i,
            /('|(\\x27)|(\\x22)|(%27)|(%22))/,
            /(UNION\s+SELECT)/i,
            /(\bor\b\s+1=1)/i,
            /(\bunion\b.*\bselect\b)/i,
        ];
        const content = JSON.stringify({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return suspiciousPatterns.some(pattern => pattern.test(content));
    }
    /**
     * Detect XSS patterns
     */
    detectXSS(req) {
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe[^>]*>/gi,
            /<object[^>]*>/gi,
            /<embed[^>]*>/gi,
        ];
        const content = JSON.stringify({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return xssPatterns.some(pattern => pattern.test(content));
    }
    /**
     * Detect path traversal attempts
     */
    detectPathTraversal(req) {
        const traversalPatterns = [
            /\.\.\//,
            /%2e%2e%2f/gi,
            /%252e%252e%252f/gi,
            /\\.*\\/, // Windows path traversal
        ];
        const content = req.path + JSON.stringify({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return traversalPatterns.some(pattern => pattern.test(content));
    }
    /**
     * Detect unusual request patterns
     */
    detectUnusualPattern(req) {
        // Check for unusual headers
        const unusualHeaders = [
            'x-forwarded-host',
            'x-original-url',
            'x-rewrite-url',
            'x-originating-ip',
        ];
        const hasUnusualHeaders = unusualHeaders.some(header => req.headers[header] && !header.startsWith('x-forwarded'));
        // Check for very long parameters
        const content = JSON.stringify({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        const hasLongParams = content.length > 10000;
        return hasUnusualHeaders || hasLongParams;
    }
    /**
     * Sanitize headers for logging
     */
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        sensitiveHeaders.forEach(header => {
            if (sanitized[header]) {
                sanitized[header] = '[REDACTED]';
            }
        });
        return sanitized;
    }
};
exports.EnhancedSecurityMiddleware = EnhancedSecurityMiddleware;
exports.EnhancedSecurityMiddleware = EnhancedSecurityMiddleware = EnhancedSecurityMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [security_logging_service_1.SecurityLoggingService,
        enhanced_rate_limit_service_1.EnhancedRateLimitService,
        input_sanitization_service_1.InputSanitizationService])
], EnhancedSecurityMiddleware);
//# sourceMappingURL=enhanced-security.middleware.js.map