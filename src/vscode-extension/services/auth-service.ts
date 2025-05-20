import * as crypto from 'crypto';
import * as vscode from 'vscode';
// Removed duplicate imports below
import { log, logError, logWarning, showError, showInfo } from '../src/utils/logging.js';

/**
 * Token information
 */
export interface TokenInfo {
    /**
     * Token value
     */
    token: string;

    /**
     * Client ID associated with the token
     */
    clientId: string;

    /**
     * Token creation timestamp
     */
    createdAt: number;

    /**
     * Token expiration timestamp
     */
    expiresAt: number;

    /**
     * Refresh token value
     */
    refreshToken: string;

    /**
     * Refresh token expiration timestamp
     */
    refreshExpiresAt: number;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
    /**
     * Token expiration time in milliseconds
     */
    tokenExpirationMs: number;

    /**
     * Refresh token expiration time in milliseconds
     */
    refreshTokenExpirationMs: number;

    /**
     * Secret key for token signing
     */
    secretKey: string;
}

/**
 * Authentication service for WebSocket connections
 */
export class AuthService {
    private static instance: AuthService;
    // Use the new logging functions directly or map them
    private logger = {
        info: log,
        warn: logWarning,
        error: logError,
    };
    private config: AuthConfig;
    private tokens: Map<string, TokenInfo> = new Map();
    private refreshTokens: Map<string, string> = new Map(); // refreshToken -> clientId
    private cleanupInterval: NodeJS.Timeout | null = null;

    /**
     * Get the singleton instance
     */
    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }

        return AuthService.instance;
    }

    /**
     * Private constructor
     */
    private constructor() {
        // Logging is initialized in extension.ts, no need to initialize here

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
    public generateToken(clientId: string): TokenInfo {
        const now = Date.now();

        // Generate tokens
        const token = this.generateRandomToken();
        const refreshToken = this.generateRandomToken();

        // Create token info
        const tokenInfo: TokenInfo = {
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
    public validateToken(token: string): string | null {
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
    public refreshToken(refreshToken: string): TokenInfo | null {
        const clientId = this.refreshTokens.get(refreshToken);

        if (!clientId) {
            this.logger.warn('Token refresh failed: Refresh token not found');
            return null;
        }

        // Find the token info for this client
        let tokenInfo: TokenInfo | undefined;
        let oldToken: string | undefined;

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
    public revokeToken(token: string): boolean {
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
    public revokeClientTokens(clientId: string): number {
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
    public getTokenInfo(token: string): TokenInfo | null {
        return this.tokens.get(token) || null;
    }

    /**
     * Update configuration
     * @param config New configuration
     */
    public updateConfig(config: Partial<AuthConfig>): void {
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
    private generateRandomToken(): string {
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
    private startCleanupInterval(): void {
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
    public dispose(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        this.tokens.clear();
        this.refreshTokens.clear();

        this.logger.info('Auth service disposed');
    }
}
