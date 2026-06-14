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
exports.CsrfProtectionMiddleware = void 0;
exports.SkipCsrfValidation = SkipCsrfValidation;
exports.shouldSkipCsrf = shouldSkipCsrf;
exports.generateTestCsrfToken = generateTestCsrfToken;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("node:crypto"));
let CsrfProtectionMiddleware = class CsrfProtectionMiddleware {
    constructor(configService) {
        this.configService = configService;
        this.tokenStore = new Map();
        this.csrfToken = this.configService.get('CSRF_SECRET') || crypto.randomBytes(32).toString('hex');
    }
    use(req, res, next) {
        // Skip CSRF check for safe methods and external APIs
        if (this.shouldSkipCsrfCheck(req)) {
            return next();
        }
        // Generate or retrieve CSRF token for session
        const sessionId = this.getSessionId(req);
        if (!sessionId) {
            throw new common_1.UnauthorizedException('No session found');
        }
        // Check if token exists and is valid
        const tokenEntry = this.tokenStore.get(sessionId);
        if (!tokenEntry || tokenEntry.expires < Date.now()) {
            // Generate new token
            const newToken = this.generateCsrfToken();
            this.tokenStore.set(sessionId, {
                token: newToken,
                expires: Date.now() + (30 * 60 * 1000) // 30 minutes
            });
            // Set token in response cookie
            this.setCsrfCookie(res, newToken);
            if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
                throw new common_1.UnauthorizedException('CSRF token required');
            }
        }
        // For state-changing requests, validate CSRF token
        if (this.isStateChangingRequest(req)) {
            const csrfToken = this.extractCsrfToken(req);
            if (!csrfToken || !this.validateCsrfToken(sessionId, csrfToken)) {
                throw new common_1.UnauthorizedException('Invalid CSRF token');
            }
        }
        // Add CSRF token to response headers for forms
        this.addCsrfTokenToResponse(res, sessionId);
        next();
    }
    shouldSkipCsrfCheck(req) {
        const skipPaths = [
            '/api/webhooks',
            '/api/health',
            '/api/docs',
            '/api/auth/refresh',
            '/api/auth/login'
        ];
        // Skip for safe methods
        const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
        if (safeMethods.includes(req.method)) {
            return true;
        }
        // Skip for specified paths
        return skipPaths.some(path => req.path.startsWith(path));
    }
    isStateChangingRequest(req) {
        const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
        return stateChangingMethods.includes(req.method);
    }
    getSessionId(req) {
        // Try to get session ID from various sources
        return (req.sessionID ||
            req.cookies?.sessionId ||
            req.headers['x-session-id'] ||
            this.extractSessionFromAuthHeader(req.headers.authorization));
    }
    extractSessionFromAuthHeader(authHeader) {
        if (!authHeader)
            return null;
        // Extract session from JWT or other auth tokens
        try {
            const token = authHeader.replace('Bearer ', '');
            // Simple session extraction - in real implementation, decode JWT
            return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
        }
        catch {
            return null;
        }
    }
    generateCsrfToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    validateCsrfToken(sessionId, token) {
        const tokenEntry = this.tokenStore.get(sessionId);
        if (!tokenEntry) {
            return false;
        }
        // Check if token matches and hasn't expired
        const isValid = tokenEntry.token === token && tokenEntry.expires > Date.now();
        // Rotate token on successful validation - token has been validated, store new one for next request
        if (isValid) {
            const newToken = this.generateCsrfToken();
            this.tokenStore.set(sessionId, {
                token: newToken,
                expires: Date.now() + (30 * 60 * 1000) // 30 minutes
            });
            // Note: Can't update cookie here as we don't have access to Response object
            // The new token will be set in addCsrfTokenToResponse
        }
        return isValid;
    }
    extractCsrfToken(req) {
        // Try to get token from header
        const headerToken = req.headers['x-csrf-token'];
        if (headerToken) {
            return headerToken;
        }
        // Try to get token from body
        if (req.body && req.body._csrf) {
            return req.body._csrf;
        }
        // Try to get token from query
        if (req.query && (req.query.csrfToken || req.query._csrf)) {
            return req.query.csrfToken || req.query._csrf;
        }
        return null;
    }
    setCsrfCookie(res, token) {
        res.cookie('XSRF-TOKEN', token, {
            httpOnly: false, // Must be accessible to JavaScript
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 60 * 1000, // 30 minutes
            path: '/'
        });
    }
    addCsrfTokenToResponse(res, sessionId) {
        const tokenEntry = this.tokenStore.get(sessionId);
        if (tokenEntry) {
            res.setHeader('X-CSRF-Token', tokenEntry.token);
        }
    }
    /**
     * Clean up expired tokens (should be called periodically)
     */
    cleanupExpiredTokens() {
        const now = Date.now();
        for (const [sessionId, tokenEntry] of this.tokenStore.entries()) {
            if (tokenEntry.expires < now) {
                this.tokenStore.delete(sessionId);
            }
        }
    }
    /**
     * Invalidate all tokens for a session
     */
    invalidateSessionTokens(sessionId) {
        this.tokenStore.delete(sessionId);
    }
};
exports.CsrfProtectionMiddleware = CsrfProtectionMiddleware;
exports.CsrfProtectionMiddleware = CsrfProtectionMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CsrfProtectionMiddleware);
// Decorator to skip CSRF validation for specific routes
// Uses Reflect metadata to mark methods that should skip CSRF validation
const SKIP_CSRF_KEY = 'skipCsrfValidation';
function SkipCsrfValidation() {
    return function (target, propertyKey, _descriptor) {
        // Store the skip flag in metadata
        Reflect.defineMetadata(SKIP_CSRF_KEY, true, target, propertyKey);
    };
}
// Helper to check if a method should skip CSRF validation
function shouldSkipCsrf(target, propertyKey) {
    return Reflect.getMetadata(SKIP_CSRF_KEY, target, propertyKey) === true;
}
// Global utility to generate CSRF token for testing
function generateTestCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
}
//# sourceMappingURL=csrf-protection.middleware.js.map