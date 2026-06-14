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
exports.SecurityValidationMiddleware = void 0;
const common_1 = require("@nestjs/common");
const input_sanitization_service_1 = require("../security/input-sanitization.service");
let SecurityValidationMiddleware = class SecurityValidationMiddleware {
    constructor(sanitizationService) {
        this.sanitizationService = sanitizationService;
    }
    use(req, res, next) {
        const startTime = Date.now();
        // Add security headers
        this.addSecurityHeaders(res);
        // Sanitize and validate request data
        this.sanitizeRequestData(req);
        // Add request ID for tracking
        this.addRequestId(req);
        // Add processing time tracking
        req['startTime'] = startTime;
        next();
    }
    addSecurityHeaders(res) {
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
            "form-action 'self';");
        // X-Frame-Options
        res.setHeader('X-Frame-Options', 'DENY');
        // X-Content-Type-Options
        res.setHeader('X-Content-Type-Options', 'nosniff');
        // X-XSS-Protection
        res.setHeader('X-XSS-Protection', '1; mode=block');
        // Referrer-Policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        // Permissions-Policy
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
        // Cache-Control
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    sanitizeRequestData(req) {
        // Sanitize query parameters - modify in place since req.query is read-only
        if (req.query && typeof req.query === 'object') {
            const sanitizedQuery = this.sanitizeObject(req.query, {
                sanitize: true,
                maxLength: 1000,
                strictMode: true,
            });
            // Clear and repopulate instead of direct assignment
            for (const key of Object.keys(req.query)) {
                delete req.query[key];
            }
            Object.assign(req.query, sanitizedQuery);
        }
        // Sanitize body
        if (req.body && typeof req.body === 'object') {
            req.body = this.sanitizeObject(req.body, {
                sanitize: true,
                maxLength: 10000,
                strictMode: true,
            });
        }
        // Sanitize URL parameters - modify in place
        if (req.params && typeof req.params === 'object') {
            const sanitizedParams = this.sanitizeObject(req.params, {
                sanitize: true,
                maxLength: 500,
                strictMode: true,
            });
            for (const key of Object.keys(req.params)) {
                delete req.params[key];
            }
            Object.assign(req.params, sanitizedParams);
        }
        // Sanitize headers (except safe ones) - skip to avoid read-only issues
        // Headers are validated but not directly replaced
    }
    sanitizeObject(obj, options = {}) {
        if (obj === null || obj === undefined) {
            return obj;
        }
        if (typeof obj === 'string') {
            return this.sanitizeString(obj, options);
        }
        if (Array.isArray(obj)) {
            return obj.map((item) => this.sanitizeObject(item, options));
        }
        if (typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                // Check if field is allowed/forbidden
                if (options.allowedFields && !options.allowedFields.includes(key)) {
                    continue;
                }
                if (options.forbiddenFields && options.forbiddenFields.includes(key)) {
                    continue;
                }
                // Sanitize the key
                const sanitizedKey = this.sanitizeString(key, { maxLength: 100 });
                if (sanitizedKey) {
                    sanitized[sanitizedKey] = this.sanitizeObject(value, options);
                }
            }
            return sanitized;
        }
        return obj;
    }
    sanitizeString(str, options = {}) {
        if (typeof str !== 'string') {
            return str;
        }
        let sanitized = str;
        // Apply length limit
        if (options.maxLength && str.length > options.maxLength) {
            sanitized = str.substring(0, options.maxLength);
        }
        // Remove control characters
        sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        if (options.sanitize) {
            // Sanitize based on type hints from key name or content
            const key = Object.keys({ str })[0] || '';
            if (key.toLowerCase().includes('email') || this.isEmail(str)) {
                sanitized = this.sanitizationService.sanitizeEmail(sanitized);
            }
            else if (key.toLowerCase().includes('phone') || this.isPhoneNumber(str)) {
                sanitized = this.sanitizationService.sanitizePhoneNumber(sanitized);
            }
            else if (key.toLowerCase().includes('url') || this.isUrl(str)) {
                sanitized = this.sanitizationService.sanitizeUrl(sanitized);
            }
            else if (key.toLowerCase().includes('html') || this.isHTML(str)) {
                sanitized = this.sanitizationService.sanitizeHTML(sanitized);
            }
            else if (key.toLowerCase().includes('ip') || this.isIPAddress(str)) {
                sanitized = this.sanitizationService.sanitizeIPAddress(sanitized);
            }
            else {
                // General text sanitization
                sanitized = this.sanitizationService.sanitizeText(sanitized);
            }
        }
        return sanitized;
    }
    addRequestId(req) {
        req['requestId'] = this.generateRequestId();
        req['timestamp'] = new Date().toISOString();
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    getSafeHeaders(headers) {
        const safeHeaders = {};
        const allowedHeaders = [
            'accept',
            'accept-language',
            'accept-encoding',
            'authorization',
            'cache-control',
            'content-type',
            'content-length',
            'user-agent',
            'x-requested-with',
            'x-api-key',
            'x-client-version',
        ];
        for (const [key, value] of Object.entries(headers)) {
            if (allowedHeaders.includes(key.toLowerCase())) {
                safeHeaders[key] =
                    typeof value === 'string' ? this.sanitizationService.sanitizeText(value) : value;
            }
        }
        return safeHeaders;
    }
    isEmail(str) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(str);
    }
    isPhoneNumber(str) {
        const phoneRegex = /^[\d+\-().\s]+$/;
        return phoneRegex.test(str) && str.replace(/[\d]/g, '').length <= 10;
    }
    isUrl(str) {
        try {
            new URL(str);
            return true;
        }
        catch {
            return false;
        }
    }
    isHTML(str) {
        return /<[^>]*>/.test(str);
    }
    isIPAddress(str) {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
        return ipv4Regex.test(str) || ipv6Regex.test(str);
    }
};
exports.SecurityValidationMiddleware = SecurityValidationMiddleware;
exports.SecurityValidationMiddleware = SecurityValidationMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [input_sanitization_service_1.InputSanitizationService])
], SecurityValidationMiddleware);
//# sourceMappingURL=security-validation.middleware.js.map