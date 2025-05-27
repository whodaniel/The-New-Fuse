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
export declare class AuthService {
    private static instance;
    private logger;
    private config;
    private tokens;
    private refreshTokens;
    private cleanupInterval;
    /**
     * Get the singleton instance
     */
    static getInstance(): AuthService;
    /**
     * Private constructor
     */
    private constructor();
    /**
     * Generate a new token for a client
     * @param clientId Client identifier
     * @returns Token information
     */
    generateToken(clientId: string): TokenInfo;
    /**
     * Validate a token
     * @param token Token to validate
     * @returns Client ID if token is valid, null otherwise
     */
    validateToken(token: string): string | null;
    /**
     * Refresh a token
     * @param refreshToken Refresh token
     * @returns New token information if refresh token is valid, null otherwise
     */
    refreshToken(refreshToken: string): TokenInfo | null;
    /**
     * Revoke a token
     * @param token Token to revoke
     * @returns True if token was revoked, false otherwise
     */
    revokeToken(token: string): boolean;
    /**
     * Revoke all tokens for a client
     * @param clientId Client identifier
     * @returns Number of tokens revoked
     */
    revokeClientTokens(clientId: string): number;
    /**
     * Get token information
     * @param token Token
     * @returns Token information if token exists, null otherwise
     */
    getTokenInfo(token: string): TokenInfo | null;
    /**
     * Update configuration
     * @param config New configuration
     */
    updateConfig(config: Partial<AuthConfig>): void;
    /**
     * Generate a random token
     * @returns Random token
     */
    private generateRandomToken;
    /**
     * Start cleanup interval to remove expired tokens
     */
    private startCleanupInterval;
    /**
     * Dispose of the auth service
     */
    dispose(): void;
}
//# sourceMappingURL=auth-service.d.ts.map