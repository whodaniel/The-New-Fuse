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
exports.SecurityGuard = void 0;
exports.RequireAuth = RequireAuth;
exports.RequireRole = RequireRole;
exports.RequirePermission = RequirePermission;
exports.RateLimit = RateLimit;
exports.SanitizeInput = SanitizeInput;
exports.ValidateCSRF = ValidateCSRF;
exports.StrictMode = StrictMode;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const input_sanitization_service_1 = require("../security/input-sanitization.service");
const response_sanitization_service_1 = require("../security/response-sanitization.service");
let SecurityGuard = class SecurityGuard {
    constructor(reflector, sanitizationService, responseSanitization) {
        this.reflector = reflector;
        this.sanitizationService = sanitizationService;
        this.responseSanitization = responseSanitization;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        // Get security requirements from decorators
        const securityOptions = this.getSecurityOptions(context);
        // Rate limiting check
        await this.checkRateLimit(request, response, securityOptions.rateLimit);
        // Input validation and sanitization
        this.validateAndSanitizeInput(request, securityOptions);
        // Add security headers
        this.addSecurityHeaders(response);
        // Add request tracking
        this.addRequestTracking(request, response);
        // Pre-response processing
        this.prepareForResponse(request, response);
        return true;
    }
    getSecurityOptions(context) {
        return {
            requireAuth: this.reflector.get('requireAuth', context.getHandler()) || false,
            roles: this.reflector.get('roles', context.getHandler()) || [],
            permissions: this.reflector.get('permissions', context.getHandler()) || [],
            rateLimit: this.reflector.get('rateLimit', context.getHandler()) || {
                requests: 100,
                window: 60000,
            },
            sanitizeInput: this.reflector.get('sanitizeInput', context.getHandler()) || true,
            validateCSRF: this.reflector.get('validateCSRF', context.getHandler()) || false,
            strictMode: this.reflector.get('strictMode', context.getHandler()) || false,
        };
    }
    async checkRateLimit(request, response, options) {
        const path = this.normalizeRequestPath(request);
        if (this.isAuthBootstrapPath(path)) {
            await this.checkAuthBootstrapRateLimit(request, response);
            return;
        }
        const clientIP = this.getClientIP(request);
        const userAgent = request.headers['user-agent'] || 'unknown';
        const key = `${clientIP}:${userAgent}`;
        const now = Date.now();
        const maxRequests = this.resolvePositiveInteger(process.env.API_RATE_LIMIT_REQUESTS, options.requests, 1, 1_000_000);
        const windowMs = this.resolvePositiveInteger(process.env.API_RATE_LIMIT_WINDOW_MS, options.window, 1_000, 86_400_000);
        const maxEntries = this.resolvePositiveInteger(process.env.API_RATE_LIMIT_MAX_KEYS, 10_000, 100, 1_000_000);
        if (!request.app.locals.rateLimit) {
            request.app.locals.rateLimit = new Map();
        }
        const rateLimitData = request.app.locals.rateLimit;
        this.pruneRateLimitData(rateLimitData, now, maxEntries);
        const userData = rateLimitData.get(key) || { count: 0, resetTime: now + windowMs };
        if (now > userData.resetTime) {
            userData.count = 0;
            userData.resetTime = now + windowMs;
        }
        userData.count++;
        rateLimitData.set(key, userData);
        const remaining = Math.max(0, maxRequests - userData.count);
        const retryAfterSeconds = Math.max(1, Math.ceil((userData.resetTime - now) / 1000));
        response.setHeader('X-RateLimit-Limit', String(maxRequests));
        response.setHeader('X-RateLimit-Remaining', String(remaining));
        response.setHeader('X-RateLimit-Reset', String(Math.ceil(userData.resetTime / 1000)));
        if (userData.count > maxRequests) {
            response.setHeader('Retry-After', String(retryAfterSeconds));
            throw new common_1.HttpException('Rate limit exceeded. Please try again later.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
    normalizeRequestPath(request) {
        const raw = request.path || request.url || '';
        const withoutQuery = raw.split('?')[0] || '';
        return withoutQuery.replace(/\/+$/, '') || '/';
    }
    isAuthBootstrapPath(path) {
        return /^\/api(?:\/v1)?\/auth\/(me|supabase|login|register|refresh|google|invite-policy)(?:\/|$)/i.test(path);
    }
    async checkAuthBootstrapRateLimit(request, response) {
        const clientIP = this.getClientIP(request);
        const key = `auth-bootstrap:${clientIP}`;
        const now = Date.now();
        const maxRequests = this.resolvePositiveInteger(process.env.API_AUTH_RATE_LIMIT_REQUESTS, 60, 10, 10_000);
        const windowMs = this.resolvePositiveInteger(process.env.API_AUTH_RATE_LIMIT_WINDOW_MS, 60_000, 1_000, 86_400_000);
        const maxEntries = this.resolvePositiveInteger(process.env.API_RATE_LIMIT_MAX_KEYS, 10_000, 100, 1_000_000);
        if (!request.app.locals.authBootstrapRateLimit) {
            request.app.locals.authBootstrapRateLimit = new Map();
        }
        const rateLimitData = request.app.locals.authBootstrapRateLimit;
        this.pruneRateLimitData(rateLimitData, now, maxEntries);
        const userData = rateLimitData.get(key) || { count: 0, resetTime: now + windowMs };
        if (now > userData.resetTime) {
            userData.count = 0;
            userData.resetTime = now + windowMs;
        }
        userData.count++;
        rateLimitData.set(key, userData);
        const remaining = Math.max(0, maxRequests - userData.count);
        const retryAfterSeconds = Math.max(1, Math.ceil((userData.resetTime - now) / 1000));
        response.setHeader('X-RateLimit-Limit', String(maxRequests));
        response.setHeader('X-RateLimit-Remaining', String(remaining));
        response.setHeader('X-RateLimit-Reset', String(Math.ceil(userData.resetTime / 1000)));
        if (userData.count > maxRequests) {
            response.setHeader('Retry-After', String(retryAfterSeconds));
            throw new common_1.HttpException('Rate limit exceeded. Please try again later.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
    resolvePositiveInteger(value, fallback, min, max) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return fallback;
        }
        return Math.min(Math.max(Math.floor(parsed), min), max);
    }
    pruneRateLimitData(rateLimitData, now, maxEntries) {
        if (rateLimitData.size <= maxEntries) {
            return;
        }
        for (const [key, entry] of rateLimitData.entries()) {
            if (entry.resetTime <= now || rateLimitData.size > maxEntries) {
                rateLimitData.delete(key);
            }
        }
    }
    validateAndSanitizeInput(request, options) {
        // Sanitize all input data
        if (options.sanitizeInput) {
            // Sanitize query parameters
            if (request.query && typeof request.query === 'object') {
                Object.keys(request.query).forEach((key) => {
                    if (typeof request.query[key] === 'string') {
                        request.query[key] = this.sanitizationService.sanitizeText(request.query[key]);
                    }
                });
            }
            // Sanitize body
            if (request.body && typeof request.body === 'object') {
                request.body = this.sanitizationService.sanitizeObject(request.body);
            }
            // Sanitize params
            if (request.params && typeof request.params === 'object') {
                Object.keys(request.params).forEach((key) => {
                    if (typeof request.params[key] === 'string') {
                        request.params[key] = this.sanitizationService.sanitizeText(request.params[key]);
                    }
                });
            }
        }
        // Validate required authentication
        if (options.requireAuth && !this.isAuthenticated(request)) {
            throw new common_1.UnauthorizedException('Authentication required');
        }
        // Validate roles and permissions
        if (options.requireAuth && (options.roles.length > 0 || options.permissions.length > 0)) {
            this.validateAuthorization(request, options);
        }
        // CSRF validation for state-changing requests
        if (options.validateCSRF && this.isStateChangingRequest(request)) {
            this.validateCSRFToken(request);
        }
    }
    addSecurityHeaders(response) {
        // Security headers are already added by the middleware
        // This is a backup to ensure they're set
        if (!response.getHeader('Content-Security-Policy')) {
            response.setHeader('Content-Security-Policy', "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "frame-ancestors 'none';");
        }
        // Additional security headers
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('X-Frame-Options', 'DENY');
        response.setHeader('X-XSS-Protection', '1; mode=block');
        response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    addRequestTracking(request, response) {
        // Add unique request ID
        const requestId = this.generateRequestId();
        request['requestId'] = requestId;
        response.setHeader('X-Request-ID', requestId);
        // Add timestamp
        const timestamp = new Date().toISOString();
        request['timestamp'] = timestamp;
        response.setHeader('X-Timestamp', timestamp);
        // Add client information (sanitized)
        response.setHeader('X-Client-IP', this.getClientIP(request));
    }
    prepareForResponse(request, response) {
        // Auth responses must include JWTs verbatim — response sanitization masks *token* fields.
        const path = request.path || request.url || '';
        if (path.includes('/auth/')) {
            return;
        }
        // Store the original response methods to intercept and sanitize
        const originalJson = response.json.bind(response);
        const originalSend = response.send.bind(response);
        response.json = (body) => {
            const sanitized = this.responseSanitization.sanitizeResponse(body);
            return originalJson(sanitized);
        };
        response.send = (body) => {
            if (typeof body === 'object') {
                const sanitized = this.responseSanitization.sanitizeResponse(body);
                return originalJson(sanitized);
            }
            return originalSend(body);
        };
    }
    isAuthenticated(request) {
        // Check for valid JWT token
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false;
        }
        const token = authHeader.substring(7);
        return this.validateJWT(token);
    }
    validateJWT(token) {
        // Basic JWT validation - in production, use proper JWT validation
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return false;
            }
            // Decode and validate the payload
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            const now = Math.floor(Date.now() / 1000);
            return payload.exp > now; // Check if token is not expired
        }
        catch {
            return false;
        }
    }
    validateAuthorization(request, options) {
        const user = request.user;
        if (!user) {
            throw new common_1.UnauthorizedException('User information not found');
        }
        // Validate roles
        if (options.roles.length > 0) {
            const hasRole = options.roles.some((role) => user.roles?.includes(role));
            if (!hasRole) {
                throw new common_1.ForbiddenException('Insufficient role permissions');
            }
        }
        // Validate permissions
        if (options.permissions.length > 0) {
            const hasPermission = options.permissions.some((permission) => user.permissions?.includes(permission));
            if (!hasPermission) {
                throw new common_1.ForbiddenException('Insufficient permissions');
            }
        }
    }
    validateCSRFToken(request) {
        const csrfToken = request.headers['x-csrf-token'] || request.body._csrf;
        if (!csrfToken) {
            throw new common_1.UnauthorizedException('CSRF token required');
        }
        // Validate CSRF token (implement your CSRF validation logic)
        // This is a simplified check
        if (typeof csrfToken !== 'string' || csrfToken.length < 32) {
            throw new common_1.UnauthorizedException('Invalid CSRF token');
        }
    }
    isStateChangingRequest(request) {
        return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    }
    getClientIP(request) {
        return (request.headers['x-forwarded-for']?.split(',')[0] ||
            request.headers['x-real-ip'] ||
            request.connection.remoteAddress ||
            'unknown');
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
};
exports.SecurityGuard = SecurityGuard;
exports.SecurityGuard = SecurityGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        input_sanitization_service_1.InputSanitizationService,
        response_sanitization_service_1.ResponseSanitizationService])
], SecurityGuard);
// Security decorators
function RequireAuth() {
    return function (target, propertyKey, descriptor) {
        Reflect.defineMetadata('requireAuth', true, descriptor.value);
    };
}
function RequireRole(...roles) {
    return function (target, propertyKey, descriptor) {
        Reflect.defineMetadata('roles', roles, descriptor.value);
    };
}
function RequirePermission(...permissions) {
    return function (target, propertyKey, descriptor) {
        Reflect.defineMetadata('permissions', permissions, descriptor.value);
    };
}
function RateLimit(requests, window) {
    return function (target, propertyKey, descriptor) {
        Reflect.defineMetadata('rateLimit', { requests, window }, descriptor.value);
    };
}
function SanitizeInput() {
    return function (target, propertyKey, descriptor) {
        Reflect.defineMetadata('sanitizeInput', true, descriptor.value);
    };
}
function ValidateCSRF() {
    return function (target, propertyKey, descriptor) {
        Reflect.defineMetadata('validateCSRF', true, descriptor.value);
    };
}
function StrictMode() {
    return function (target, propertyKey, descriptor) {
        Reflect.defineMetadata('strictMode', true, descriptor.value);
    };
}
//# sourceMappingURL=security.guard.js.map