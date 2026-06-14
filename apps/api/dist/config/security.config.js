"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('security', () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        // Authentication Configuration
        jwt: {
            secret: (() => {
                const secret = process.env.JWT_SECRET;
                if (!secret) {
                    throw new Error('JWT_SECRET environment variable is required. Application cannot start without it.');
                }
                return secret;
            })(),
            expiresIn: process.env.JWT_EXPIRES_IN || '15m',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
            issuer: process.env.JWT_ISSUER || 'the-new-fuse-api',
            audience: process.env.JWT_AUDIENCE || 'the-new-fuse-clients',
        },
        // Rate Limiting Configuration
        rateLimit: {
            enabled: true,
            defaultLimit: parseInt(process.env.RATE_LIMIT_DEFAULT || '') || 100,
            defaultWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '') || 60000, // 1 minute
            tiers: {
                auth: {
                    requests: parseInt(process.env.RATE_LIMIT_AUTH || '') || 5,
                    window: 60000, // 1 minute
                },
                api: {
                    requests: parseInt(process.env.RATE_LIMIT_API || '') || 100,
                    window: 60000, // 1 minute
                },
                admin: {
                    requests: parseInt(process.env.RATE_LIMIT_ADMIN || '') || 20,
                    window: 60000, // 1 minute
                },
                public: {
                    requests: parseInt(process.env.RATE_LIMIT_PUBLIC || '') || 200,
                    window: 60000, // 1 minute
                },
                health: {
                    requests: parseInt(process.env.RATE_LIMIT_HEALTH || '') || 10,
                    window: 60000, // 1 minute
                },
            },
        },
        // CORS Configuration
        cors: {
            allowedOrigins: [
                ...(process.env.ALLOWED_ORIGINS?.split(',') ||
                    (isProduction
                        ? ['https://yourdomain.com']
                        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'])),
                'chrome-extension://kddfgejmbblgadkdmalfnagbiefbcdmi',
            ],
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'X-CSRF-Token',
                'X-Request-ID',
                'X-Client-IP',
            ],
            credentials: true,
            maxAge: 86400, // 24 hours
        },
        // Security Headers Configuration
        securityHeaders: {
            contentSecurityPolicy: "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self'; " +
                "connect-src 'self' wss: https:; " +
                "frame-src 'none'; " +
                "object-src 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'; " +
                'upgrade-insecure-requests;',
            xFrameOptions: 'DENY',
            xContentTypeOptions: 'nosniff',
            xXSSProtection: '1; mode=block',
            referrerPolicy: 'strict-origin-when-cross-origin',
            permissionsPolicy: 'geolocation=(), microphone=(), camera=(), payment=(), fullscreen=(*)',
            strictTransportSecurity: isProduction
                ? 'max-age=31536000; includeSubDomains; preload'
                : 'max-age=31536000; includeSubDomains',
        },
        // Input Validation Configuration
        inputValidation: {
            maxPayloadSize: parseInt(process.env.MAX_PAYLOAD_SIZE || '') || 10 * 1024 * 1024, // 10MB
            allowedContentTypes: [
                'application/json',
                'application/x-www-form-urlencoded',
                'multipart/form-data',
                'text/plain',
            ],
            sanitizeInput: true,
            validateFileUploads: true,
            maxFileSize: 5 * 1024 * 1024, // 5MB
        },
        // Session Management
        sessions: {
            secure: isProduction,
            httpOnly: true,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
        // Monitoring Configuration
        monitoring: {
            logLevel: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'info'),
            enableSecurityLogging: true,
            logRetention: parseInt(process.env.LOG_RETENTION_DAYS || '') || 30,
            enableMetrics: true,
            enableHealthChecks: true,
        },
        // SSL/HTTPS Configuration
        ssl: {
            required: isProduction,
            hstsMaxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        },
        // IP Filtering Configuration
        ipFiltering: {
            enabled: true,
            whitelist: process.env.IP_WHITELIST?.split(',') || [],
            blacklist: process.env.IP_BLACKLIST?.split(',') || [],
            maxFailedAttempts: 5,
            blockDuration: 60, // 60 minutes
        },
    };
});
//# sourceMappingURL=security.config.js.map