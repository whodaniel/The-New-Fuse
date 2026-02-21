"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i])
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
        return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); };
};
var _a;
import inversify_1 from 'inversify';
import types_1 from '../di/types.js';
import config_service_1 from '../config/config.service';
import error_handler_1 from '../error/error-handler.js';
import jsonwebtoken_1 from 'jsonwebtoken';
let AuthService = class AuthService {
    constructor(logger, config, errorHandler) {
        Object.defineProperty(this, "logger", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: logger
        });
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config
        });
        Object.defineProperty(this, "errorHandler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: errorHandler
        });
        Object.defineProperty(this, "SALT_ROUNDS", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 12
        });
        Object.defineProperty(this, "TOKEN_SECRET", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "REFRESH_TOKEN_SECRET", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "TOKEN_EXPIRY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "REFRESH_TOKEN_EXPIRY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "MAX_LOGIN_ATTEMPTS", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "LOCKOUT_DURATION", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.TOKEN_SECRET = this.config.get('auth.tokenSecret', 'your-secret-key');
        this.REFRESH_TOKEN_SECRET = this.config.get('auth.refreshTokenSecret', 'your-refresh-secret-key');
        this.TOKEN_EXPIRY = this.config.get('auth.tokenExpiry', '1h');
        this.REFRESH_TOKEN_EXPIRY = this.config.get('auth.refreshTokenExpiry', '7d');
        this.MAX_LOGIN_ATTEMPTS = this.config.get('auth.maxLoginAttempts', 5);
        this.LOCKOUT_DURATION = this.config.get('auth.lockoutDuration', 30 * 60 * 1000); // 30 minutes
    }
}(), Promise;
exports.AuthService = AuthService;
(credentials);
{
    try {
        const user = await this.validateCredentials(credentials);
        return this.generateToken(user);
    }
    catch (error) {
        throw this.errorHandler.createError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS', 401);
    }
}
async;
validateToken();
Promise();
Promise(token);
{
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, this.TOKEN_SECRET);
        const user = {
            id: decoded.sub,
            email: decoded.email,
            password: '', // Password is never included in the token
            roles: decoded.roles || [],
            permissions: decoded.permissions || [],
            mfaEnabled: decoded.mfaEnabled || false,
            status: decoded.status || 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return user;
    }
    catch (error) {
        throw this.errorHandler.createError('Invalid token', 'AUTH_INVALID_TOKEN', 401);
    }
}
async;
hashPassword();
Promise();
Promise(password);
{
    return (0, bcrypt_1.hash)(password, this.SALT_ROUNDS);
}
async;
validatePassword();
Promise();
Promise(password, hashedPassword);
{
    return (0, bcrypt_1.compare)(password, hashedPassword);
}
async;
validateCredentials();
Promise();
Promise(credentials);
{
    // Implement your user validation logic here
    // This is just a placeholder
    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
        return {
            id: '1',
            email: credentials.email,
            roles: ['user'],
            permissions: ['read:own_profile'],
            mfaEnabled: false,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    throw new Error('Invalid credentials');
}
generateToken(user, deviceId);
{
    const payload = {
        sub: user.id,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        mfaEnabled: user.mfaEnabled,
        status: user.status,
        deviceId
    };
    const token = (0, jsonwebtoken_1.sign)(payload, this.TOKEN_SECRET, { expiresIn: this.TOKEN_EXPIRY });
    const refreshToken = (0, jsonwebtoken_1.sign)(payload, this.REFRESH_TOKEN_SECRET, { expiresIn: this.REFRESH_TOKEN_EXPIRY });
    const expiresAt = new Date(Date.now() + ms(this.TOKEN_EXPIRY));
    return { token, refreshToken, expiresAt };
}
async;
handleFailedLogin();
Promise();
Promise(email, ip);
{
    // Implement your failed login logic here
}
async;
lockAccount();
Promise();
Promise(email);
{
    // Implement your account lock logic here
}
async;
getLoginAttempts();
Promise();
Promise(email);
{
    // Implement your login attempts logic here
    return [];
}
async;
clearLoginAttempts();
Promise();
Promise(email);
{
    // Implement your clear login attempts logic here
}
async;
getLockoutEnd();
Promise();
Promise(email);
{
    // Implement your lockout end logic here
    return null;
}
;
exports.AuthService = AuthService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.Logger)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.Config)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.ErrorHandler)),
    __metadata("design:paramtypes", [typeof (_a = typeof winston_1.Logger !== "undefined" && winston_1.Logger) === "function" ? _a : Object, config_service_1.ConfigService,
        error_handler_1.ErrorHandler])
], AuthService);
// Helper function to parse time strings
function ms(str) {
    const units = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000
    };
    const match = /^(\d+)([smhdw])$/.exec(str);
    if (!match)
        throw new Error('Invalid time string');
    const [, num, unit] = match;
    return parseInt(num, 10) * units[unit];
}
//# sourceMappingURL=auth-service.js.map
