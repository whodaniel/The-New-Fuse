import { PrismaService } from '@the-new-fuse/database';
import { EncryptionService } from '@the-new-fuse/core';
export interface RefreshTokenPayload {
    userId: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class RefreshTokenService {
    private readonly prisma;
    private readonly encryptionService;
    private readonly REFRESH_TOKEN_EXPIRY_DAYS;
    private readonly ACCESS_TOKEN_EXPIRY_MINUTES;
    private readonly MAX_REFRESH_TOKENS_PER_USER;
    constructor(prisma: PrismaService, encryptionService: EncryptionService);
    /**
     * Generate a new refresh token for a user
     */
    generateRefreshToken(payload: RefreshTokenPayload): Promise<string>;
    /**
     * Validate and extract payload from refresh token
     */
    validateRefreshToken(token: string): Promise<RefreshTokenPayload>;
    /**
     * Revoke a specific refresh token
     */
    revokeRefreshToken(token: string): Promise<void>;
    /**
     * Revoke all refresh tokens for a user
     */
    revokeAllRefreshTokens(userId: string): Promise<void>;
    /**
     * Rotate refresh token (revoke old, generate new)
     */
    rotateRefreshToken(oldToken: string, payload: RefreshTokenPayload): Promise<string>;
    /**
     * Clean up expired and old tokens for a user
     */
    private cleanupOldTokens;
    /**
     * Get active refresh tokens for a user
     */
    getUserRefreshTokens(userId: string): Promise<any>;
    /**
     * Check if a user has reached the maximum refresh token limit
     */
    hasReachedTokenLimit(userId: string): Promise<boolean>;
    /**
     * Cleanup all expired tokens (can be run as a cron job)
     */
    cleanupExpiredTokens(): Promise<number>;
}
//# sourceMappingURL=refresh-token.service.d.ts.map