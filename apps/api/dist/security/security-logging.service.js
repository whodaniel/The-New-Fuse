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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityLoggingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const winston = __importStar(require("winston"));
require("winston-daily-rotate-file");
let SecurityLoggingService = class SecurityLoggingService {
    constructor(configService) {
        this.configService = configService;
        // Check for production or CloudRuntime environment - use console-only logging
        const isProduction = process.env.NODE_ENV === 'production' || process.env.CLOUD_RUNTIME_ENVIRONMENT;
        // Main application logger - console only
        const appTransports = [
            new winston.transports.Console({
                format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
            }),
        ];
        // Only add file logging in local development (not in production or CloudRuntime)
        if (!isProduction) {
            try {
                // Ensure logs directory exists and is writable
                const fs = require('fs');
                const logDir = 'logs';
                if (!fs.existsSync(logDir)) {
                    fs.mkdirSync(logDir, { recursive: true });
                }
                appTransports.push(new winston.transports.DailyRotateFile({
                    filename: `${logDir}/app-%DATE%.log`,
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                }));
            }
            catch (error) {
                console.warn('File logging disabled:', error.message);
            }
        }
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports: appTransports,
        });
        // Dedicated security logger - console only in production
        const securityTransports = [
            new winston.transports.Console({
                format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
            }),
        ];
        // Only add file logging in local development
        if (!isProduction) {
            try {
                const fs = require('fs');
                const logDir = 'logs';
                if (!fs.existsSync(logDir)) {
                    fs.mkdirSync(logDir, { recursive: true });
                }
                securityTransports.push(new winston.transports.DailyRotateFile({
                    filename: `${logDir}/security-%DATE%.log`,
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '30d',
                }));
            }
            catch (error) {
                console.warn('Security file logging disabled:', error.message);
            }
        }
        this.securityLogger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports: securityTransports,
        });
    }
    /**
     * Log authentication events
     */
    logAuthEvent(event, details) {
        const entry = {
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
    logAuthZEvent(event, details) {
        const entry = {
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
    logRateLimit(action, details) {
        const entry = {
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
    logInputValidation(endpoint, method, details) {
        const entry = {
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
    logApiAccess(method, endpoint, details) {
        const entry = {
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
    logSecurityViolation(violation, details) {
        const entry = {
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
    getSecurityMetrics() {
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
};
exports.SecurityLoggingService = SecurityLoggingService;
exports.SecurityLoggingService = SecurityLoggingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityLoggingService);
//# sourceMappingURL=security-logging.service.js.map