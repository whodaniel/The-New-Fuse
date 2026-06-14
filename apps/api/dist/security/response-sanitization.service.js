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
exports.ResponseSanitizationService = void 0;
const common_1 = require("@nestjs/common");
const input_sanitization_service_1 = require("./input-sanitization.service");
let ResponseSanitizationService = class ResponseSanitizationService {
    constructor(sanitizationService) {
        this.sanitizationService = sanitizationService;
        this.defaultSensitivePatterns = [
            /password/i,
            /passwd/i,
            /secret/i,
            /token/i,
            /authorization/i,
            /api[_-]?key/i,
            /private[_-]?key/i,
            /access[_-]?key/i,
            /client[_-]?secret/i,
            /credential/i,
            /private/i,
            /ssn/i,
            /social.*security/i,
            /credit.*card/i,
            /cvv/i,
            /pin/i,
            /api.*key/i,
            /access.*token/i,
            /refresh.*token/i,
        ];
    }
    /**
     * Sanitize response object to remove sensitive information
     */
    sanitizeResponse(data, options = {}) {
        const sanitizedOptions = {
            excludeFields: [],
            maskFields: ['password', 'secret', 'token', 'apiKey', 'privateKey', 'accessKey'],
            maskChar: '*',
            maxDepth: 10,
            sensitiveDataPatterns: this.defaultSensitivePatterns,
            ...options,
        };
        return this.sanitizeObject(data, sanitizedOptions, 0);
    }
    /**
     * Sanitize database query results
     */
    sanitizeDatabaseResult(data, options = {}) {
        const dbOptions = {
            excludeFields: ['password_hash', 'salt', 'created_at', 'updated_at'],
            maskFields: ['email', 'phone', 'address'],
            maxDepth: 5,
            ...options,
        };
        return this.sanitizeResponse(data, dbOptions);
    }
    /**
     * Sanitize user profile data
     */
    sanitizeUserProfile(data, isOwner = false) {
        const userOptions = {
            excludeFields: isOwner ? [] : ['phone', 'address', 'date_of_birth', 'ssn'],
            maskFields: isOwner ? ['email'] : ['email', 'first_name', 'last_name'],
            maskChar: '*',
            maxDepth: 3,
        };
        return this.sanitizeResponse(data, userOptions);
    }
    /**
     * Sanitize API error responses
     */
    sanitizeError(error) {
        const sanitized = {
            message: this.sanitizeErrorMessage(error.message),
            statusCode: error.statusCode || 500,
            timestamp: new Date().toISOString(),
            path: error.path || '',
        };
        // Only include stack trace in development
        if (process.env.NODE_ENV === 'development' && error.stack) {
            sanitized['stack'] = this.sanitizeStackTrace(error.stack);
        }
        return sanitized;
    }
    /**
     * Sanitize logs to prevent sensitive data leakage
     */
    sanitizeLogData(data) {
        const logOptions = {
            excludeFields: ['password', 'token', 'secret', 'key'],
            maskFields: ['email', 'user_id', 'session_id', 'ip_address'],
            maxDepth: 5,
        };
        return this.sanitizeResponse(data, logOptions);
    }
    sanitizeObject(obj, options, depth) {
        if (obj === null || obj === undefined) {
            return obj;
        }
        if (depth > (options.maxDepth || 10)) {
            return '[Max Depth Exceeded]';
        }
        if (typeof obj === 'string') {
            return this.sanitizeString(obj, options);
        }
        if (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'bigint') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map((item) => this.sanitizeObject(item, options, depth + 1));
        }
        if (typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                const sanitizedKey = this.sanitizeString(key, options);
                if (!sanitizedKey) {
                    continue; // Skip invalid keys
                }
                // Check if field should be excluded
                if (options.excludeFields?.some((field) => this.matchesPattern(field, sanitizedKey))) {
                    continue;
                }
                // Check if field should be masked
                if (options.maskFields?.some((field) => this.matchesPattern(field, sanitizedKey))) {
                    sanitized[sanitizedKey] = this.maskValue(value, options.maskChar || '*');
                    continue;
                }
                // Check if field matches sensitive data patterns
                if (this.isSensitiveField(sanitizedKey, options.sensitiveDataPatterns || [])) {
                    sanitized[sanitizedKey] = this.maskValue(value, options.maskChar || '*');
                    continue;
                }
                // Recursively sanitize the value
                sanitized[sanitizedKey] = this.sanitizeObject(value, options, depth + 1);
            }
            return sanitized;
        }
        return obj;
    }
    sanitizeString(str, options) {
        if (typeof str !== 'string') {
            return str;
        }
        // Remove control characters and limit length
        return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').substring(0, 10000);
    }
    maskValue(value, maskChar) {
        if (value === null || value === undefined) {
            return '';
        }
        const str = String(value);
        if (str.length <= 4) {
            return maskChar.repeat(str.length);
        }
        return str.substring(0, 2) + maskChar.repeat(str.length - 4) + str.substring(str.length - 2);
    }
    matchesPattern(pattern, value) {
        // Exact match
        if (pattern === value) {
            return true;
        }
        // Regex match
        if (pattern.startsWith('/') && pattern.endsWith('/')) {
            const regex = new RegExp(pattern.slice(1, -1), 'i');
            return regex.test(value);
        }
        // Case-insensitive partial match
        return value.toLowerCase().includes(pattern.toLowerCase());
    }
    isSensitiveField(fieldName, patterns) {
        return patterns.some((pattern) => pattern.test(fieldName));
    }
    sanitizeErrorMessage(message) {
        if (!message || typeof message !== 'string') {
            return 'An error occurred';
        }
        // Remove potential stack traces and internal details
        return message
            .replace(/at\s+[^\n]+\n/g, '') // Remove stack trace lines
            .replace(/File\s+"[^"]+",\s+line\s+\d+/g, '') // Remove file references
            .replace(/\binternal[/\\][^/\n]+/g, '[internal]') // Mask internal paths
            .substring(0, 500); // Limit error message length
    }
    sanitizeStackTrace(stackTrace) {
        if (!stackTrace || typeof stackTrace !== 'string') {
            return '';
        }
        return stackTrace
            .split('\n')
            .filter((line) => !line.includes('node_modules')) // Remove external stack traces
            .map((line) => {
            // Mask file paths
            return line.replace(/File\s+"([^"]+)"/g, 'File "[masked]"');
        })
            .join('\n')
            .substring(0, 2000); // Limit stack trace length
    }
    /**
     * Create a sanitized version of an object for logging
     */
    createLogSafeObject(obj) {
        return this.sanitizeLogData(obj);
    }
    /**
     * Remove PII (Personally Identifiable Information) from data
     */
    removePII(data) {
        const piiFields = [
            'ssn',
            'social_security_number',
            'socialSecurityNumber',
            'credit_card',
            'creditCard',
            'cvv',
            'pin',
            'date_of_birth',
            'dateOfBirth',
            'dob',
            'passport',
            'driver_license',
            'driverLicense',
            'bank_account',
            'bankAccount',
            'routing_number',
            'routingNumber',
        ];
        const options = {
            excludeFields: piiFields,
            maxDepth: 5,
        };
        return this.sanitizeResponse(data, options);
    }
};
exports.ResponseSanitizationService = ResponseSanitizationService;
exports.ResponseSanitizationService = ResponseSanitizationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [input_sanitization_service_1.InputSanitizationService])
], ResponseSanitizationService);
//# sourceMappingURL=response-sanitization.service.js.map