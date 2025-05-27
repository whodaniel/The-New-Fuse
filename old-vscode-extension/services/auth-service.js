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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto = __importStar(require("crypto"));
const vscode = __importStar(require("vscode"));
const logging_1 = require("../src/utils/logging");
/**
 * Authentication service for WebSocket connections
 */
class AuthService {
    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    /**
     * Private constructor
     */
    constructor() {
        // Logging is initialized in extension.ts, no need to initialize here
        // Use the new logging functions directly or map them
        this.logger = {
            info: logging_1.log,
            warn: logging_1.logWarning,
            error: logging_1.logError,
        };
        this.tokens = new Map();
        this.refreshTokens = new Map(); // refreshToken -> clientId
        this.cleanupInterval = null;
        // Load configuration
        const config = vscode.workspace.getConfiguration('thefuse');
        // Generate a secret key if not already set
        let secretKey = config.get('authSecretKey', '');
        if (!secretKey) {
            secretKey = crypto.randomBytes(32).toString('hex');
            config.update('authSecretKey', secretKey, true);
        }
        this.config = {
            tokenExpirationMs: config.get('authTokenExpirationMs', 3600000), // 1 hour
            refreshTokenExpirationMs: config.get('authRefreshTokenExpirationMs', 86400000), // 24 hours
            secretKey
        };
        this.logger.info('Auth service initialized');
        // Start cleanup interval
        this.startCleanupInterval();
    }
    /**
     * Generate a new token for a client
     * @param clientId Client identifier
     * @returns Token information
     */
    generateToken(clientId) {
        const now = Date.now();
        // Generate tokens
        const token = this.generateRandomToken();
        const refreshToken = this.generateRandomToken();
        // Create token info
        const tokenInfo = {
            token,
            clientId,
            createdAt: now,
            expiresAt: now + this.config.tokenExpirationMs,
            refreshToken,
            refreshExpiresAt: now + this.config.refreshTokenExpirationMs
        };
        // Store token info
        this.tokens.set(token, tokenInfo);
        this.refreshTokens.set(refreshToken, clientId);
        this.logger.info(`Generated token for client ${clientId}`);
        return tokenInfo;
    }
    /**
     * Validate a token
     * @param token Token to validate
     * @returns Client ID if token is valid, null otherwise
     */
    validateToken(token) {
        const tokenInfo = this.tokens.get(token);
        if (!tokenInfo) {
            this.logger.warn('Token validation failed: Token not found');
            return null;
        }
        // Check if token has expired
        if (tokenInfo.expiresAt < Date.now()) {
            this.logger.warn(`Token validation failed: Token expired for client ${tokenInfo.clientId}`);
            this.tokens.delete(token);
            return null;
        }
        this.logger.info(`Token validated for client ${tokenInfo.clientId}`);
        return tokenInfo.clientId;
    }
    /**
     * Refresh a token
     * @param refreshToken Refresh token
     * @returns New token information if refresh token is valid, null otherwise
     */
    refreshToken(refreshToken) {
        const clientId = this.refreshTokens.get(refreshToken);
        if (!clientId) {
            this.logger.warn('Token refresh failed: Refresh token not found');
            return null;
        }
        // Find the token info for this client
        let tokenInfo;
        let oldToken;
        for (const [token, info] of this.tokens.entries()) {
            if (info.clientId === clientId && info.refreshToken === refreshToken) {
                tokenInfo = info;
                oldToken = token;
                break;
            }
        }
        if (!tokenInfo || !oldToken) {
            this.logger.warn(`Token refresh failed: Token info not found for client ${clientId}`);
            this.refreshTokens.delete(refreshToken);
            return null;
        }
        // Check if refresh token has expired
        if (tokenInfo.refreshExpiresAt < Date.now()) {
            this.logger.warn(`Token refresh failed: Refresh token expired for client ${clientId}`);
            this.tokens.delete(oldToken);
            this.refreshTokens.delete(refreshToken);
            return null;
        }
        // Generate a new token
        const newTokenInfo = this.generateToken(clientId);
        // Remove old token
        this.tokens.delete(oldToken);
        this.refreshTokens.delete(refreshToken);
        this.logger.info(`Token refreshed for client ${clientId}`);
        return newTokenInfo;
    }
    /**
     * Revoke a token
     * @param token Token to revoke
     * @returns True if token was revoked, false otherwise
     */
    revokeToken(token) {
        const tokenInfo = this.tokens.get(token);
        if (!tokenInfo) {
            this.logger.warn('Token revocation failed: Token not found');
            return false;
        }
        // Remove token and refresh token
        this.tokens.delete(token);
        this.refreshTokens.delete(tokenInfo.refreshToken);
        this.logger.info(`Token revoked for client ${tokenInfo.clientId}`);
        return true;
    }
    /**
     * Revoke all tokens for a client
     * @param clientId Client identifier
     * @returns Number of tokens revoked
     */
    revokeClientTokens(clientId) {
        let count = 0;
        // Find and remove all tokens for this client
        for (const [token, info] of this.tokens.entries()) {
            if (info.clientId === clientId) {
                this.tokens.delete(token);
                this.refreshTokens.delete(info.refreshToken);
                count++;
            }
        }
        if (count > 0) {
            this.logger.info(`Revoked ${count} tokens for client ${clientId}`);
        }
        return count;
    }
    /**
     * Get token information
     * @param token Token
     * @returns Token information if token exists, null otherwise
     */
    getTokenInfo(token) {
        return this.tokens.get(token) || null;
    }
    /**
     * Update configuration
     * @param config New configuration
     */
    updateConfig(config) {
        this.config = {
            ...this.config,
            ...config
        };
        this.logger.info('Auth service configuration updated');
    }
    /**
     * Generate a random token
     * @returns Random token
     */
    generateRandomToken() {
        // Generate a random token using crypto
        const randomBytes = crypto.randomBytes(32);
        // Create a signature using the secret key
        const hmac = crypto.createHmac('sha256', this.config.secretKey);
        hmac.update(randomBytes);
        // Combine random bytes and signature
        return randomBytes.toString('hex') + '.' + hmac.digest('hex');
    }
    /**
     * Start cleanup interval to remove expired tokens
     */
    startCleanupInterval() {
        // Clear existing interval if any
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        // Run cleanup every hour
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            let expiredTokens = 0;
            let expiredRefreshTokens = 0;
            // Remove expired tokens
            for (const [token, info] of this.tokens.entries()) {
                if (info.expiresAt < now) {
                    this.tokens.delete(token);
                    expiredTokens++;
                }
            }
            // Remove expired refresh tokens
            for (const [refreshToken, clientId] of this.refreshTokens.entries()) {
                let found = false;
                // Check if there's a valid token using this refresh token
                for (const info of this.tokens.values()) {
                    if (info.clientId === clientId && info.refreshToken === refreshToken && info.refreshExpiresAt >= now) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    this.refreshTokens.delete(refreshToken);
                    expiredRefreshTokens++;
                }
            }
            if (expiredTokens > 0 || expiredRefreshTokens > 0) {
                this.logger.info(`Cleanup: Removed ${expiredTokens} expired tokens and ${expiredRefreshTokens} expired refresh tokens`);
            }
        }, 3600000); // Run every hour
    }
    /**
     * Dispose of the auth service
     */
    dispose() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.tokens.clear();
        this.refreshTokens.clear();
        this.logger.info('Auth service disposed');
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth-service.js.map