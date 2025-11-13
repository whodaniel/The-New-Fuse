"use strict";
// Minimal security stub exports for disabled security package
// This provides the expected API surface without actual security implementation
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.SecurityService = void 0;
// Security Service Stub
class SecurityService {
    async validateApiKey(apiKey) {
        return true; // Always allow when security is disabled
    }
    async validateUser(userId) {
        return { id: userId, roles: ['user'] }; // Minimal user stub
    }
}
exports.SecurityService = SecurityService;
// Auth Service Stub  
class AuthService {
    async login(credentials, ...args) {
        return { token: 'disabled-token', user: credentials };
    }
    async register(userData, ...args) {
        return { token: 'disabled-token', user: userData };
    }
    async validateToken(token) {
        return { valid: true, user: { id: 'disabled-user'
            },
            async refresh(refreshToken) {
                return { token: 'disabled-token', refreshToken: 'disabled-refresh-token' };
            },
            async logout(...args) {
                return { message: 'Logout successful (security disabled)' };
            },
            async getCurrentUser() {
                return { id: 'disabled-user', email: 'disabled@security.test', roles: ['user'] };
            }
        };
        // Guards (always allow)
        export class JwtAuthGuard {
            canActivate() {
                return true; // Always allow when security is disabled
            }
        }
        export class RolesGuard {
            canActivate() {
                return true; // Always allow when security is disabled
            }
        }
        export class RateLimitGuard {
            canActivate() {
                return true; // Always allow when security is disabled
            }
        }
        // Decorators (no-op)
        export function RequireRole(role) {
            return function (target, propertyKey, descriptor) {
                // No-op decorator when security is disabled
                return descriptor;
            };
        }
        export function RequirePermission(permission) {
            return function (target, propertyKey, descriptor) {
                // No-op decorator when security is disabled
                return descriptor;
            };
        }
        export function CurrentUser() {
            return function (target, propertyKey, parameterIndex) {
                // No-op decorator when security is disabled
            };
        }
        // Modules (empty modules)
        export class SecurityModule {
        }
        export class AuthModule {
        }
        export class RbacModule {
        }
        export class MfaModule {
        }
        export class AuditLoggingModule {
        }
        export class JwtModule {
        }
        // Services (stub implementations)
        export class RbacService {
            async hasPermission(userId, permission) {
                return true; // Always allow when security is disabled
            }
        }
        export class MfaService {
            async generateSecret() {
                return { secret: 'disabled', qrCode: 'disabled' };
            }
            async verifyToken(secret, token) {
                return true; // Always allow when security is disabled
            }
        }
        export class AuditLoggingService {
            async log(event) {
                // No-op when security is disabled
            }
        }
        export class HashingService {
            async hash(password) {
                return password; // Don't actually hash when security is disabled
            }
            async compare(password, hash) {
                return password === hash; // Simple comparison when security is disabled
            }
        }
        export class RateLimiterService {
            async checkLimit(key) {
                return true; // Always allow when security is disabled
            }
        }
        // Controllers (minimal implementations)
        export class AuthController {
            async login(body) {
                return { token: 'disabled-token', user: body };
            }
            async register(body) {
                return { token: 'disabled-token', user: body };
            }
        }
        export class RateLimitController {
            async getStatus() {
                return { enabled: false, message: 'Rate limiting disabled' };
            }
        }
        // Middleware (no-op)
        export class AuthMiddleware {
            use(req, res, next) {
                next(); // Pass through when security is disabled
            }
        }
        export class RateLimitMiddleware {
            use(req, res, next) {
                next(); // Pass through when security is disabled
            }
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=index.js.map