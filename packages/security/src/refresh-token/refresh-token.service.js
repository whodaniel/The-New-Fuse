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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const core_1 = require("@the-new-fuse/core");
const crypto_1 = require("crypto");
const date_fns_1 = require("date-fns");
let RefreshTokenService = class RefreshTokenService {
    prisma;
    encryptionService;
    REFRESH_TOKEN_EXPIRY_DAYS = 30;
    ACCESS_TOKEN_EXPIRY_MINUTES = 15;
    MAX_REFRESH_TOKENS_PER_USER = 5;
    constructor(prisma, encryptionService) {
        this.prisma = prisma;
        this.encryptionService = encryptionService;
    }
    /**
     * Generate a new refresh token for a user
     */
    async generateRefreshToken(payload) {
        const tokenData = {
            userId: payload.userId,
            timestamp: Date.now(),
            random: (0, crypto_1.randomBytes)(32).toString('hex'),
        };
        // Encrypt the token data
        const encryptedToken = await this.encryptionService.encrypt(JSON.stringify(tokenData), process.env.REFRESH_TOKEN_SECRET || 'default-secret');
        // Store in database
        const expiresAt = (0, date_fns_1.addDays)(new Date(), this.REFRESH_TOKEN_EXPIRY_DAYS);
        await this.prisma.refreshToken.create({
            data: {
                userId: payload.userId,
                token: encryptedToken,
                expiresAt,
                deviceInfo: payload.deviceInfo,
                ipAddress: payload.ipAddress,
                userAgent: payload.userAgent,
            },
        });
        // Clean up old tokens for this user
        await this.cleanupOldTokens(payload.userId);
        return encryptedToken;
    }
    /**
     * Validate and extract payload from refresh token
     */
    async validateRefreshToken(token) {
        try {
            // Find token in database
            const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
                where: { token },
                include: { user: true },
            });
            if (!refreshTokenRecord) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            // Check if token is revoked
            if (refreshTokenRecord.isRevoked) {
                throw new common_1.UnauthorizedException('Refresh token has been revoked');
            }
            // Check if token is expired
            if ((0, date_fns_1.isPast)(refreshTokenRecord.expiresAt)) {
                // Mark as revoked and clean up
                await this.revokeRefreshToken(token);
                throw new common_1.UnauthorizedException('Refresh token has expired');
            }
            // Decrypt and validate token data
            const decryptedData = await this.encryptionService.decrypt(token, process.env.REFRESH_TOKEN_SECRET || 'default-secret');
            const tokenData = JSON.parse(decryptedData);
            // Validate token structure
            if (!tokenData.userId || !tokenData.timestamp || !tokenData.random) {
                throw new common_1.UnauthorizedException('Invalid token format');
            }
            // Validate user still exists and is active
            if (!refreshTokenRecord.user.isActive) {
                throw new common_1.UnauthorizedException('User account is inactive');
            }
            return {
                userId: tokenData.userId,
                deviceInfo: refreshTokenRecord.deviceInfo,
                ipAddress: refreshTokenRecord.ipAddress,
                userAgent: refreshTokenRecord.userAgent,
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    /**
     * Revoke a specific refresh token
     */
    async revokeRefreshToken(token) {
        await this.prisma.refreshToken.updateMany({
            where: { token },
            data: { isRevoked: true },
        });
    }
    /**
     * Revoke all refresh tokens for a user
     */
    async revokeAllRefreshTokens(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId },
            data: { isRevoked: true },
        });
    }
    /**
     * Rotate refresh token (revoke old, generate new)
     */
    async rotateRefreshToken(oldToken, payload) {
        // Validate the old token first
        await this.validateRefreshToken(oldToken);
        // Revoke the old token
        await this.revokeRefreshToken(oldToken);
        // Generate new token
        return this.generateRefreshToken(payload);
    }
    /**
     * Clean up expired and old tokens for a user
     */
    async cleanupOldTokens(userId) {
        // Remove expired tokens
        await this.prisma.refreshToken.deleteMany({
            where: {
                userId,
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { isRevoked: true },
                ],
            },
        });
        // Keep only the most recent tokens (up to MAX_REFRESH_TOKENS_PER_USER)
        const userTokens = await this.prisma.refreshToken.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip: this.MAX_REFRESH_TOKENS_PER_USER,
        });
        if (userTokens.length > 0) {
            await this.prisma.refreshToken.deleteMany({
                where: {
                    id: { in: userTokens.map(token => token.id) },
                },
            });
        }
    }
    /**
     * Get active refresh tokens for a user
     */
    async getUserRefreshTokens(userId) {
        return this.prisma.refreshToken.findMany({
            where: {
                userId,
                isRevoked: false,
                expiresAt: { gt: new Date() },
            },
            select: {
                id: true,
                deviceInfo: true,
                ipAddress: true,
                userAgent: true,
                createdAt: true,
                expiresAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Check if a user has reached the maximum refresh token limit
     */
    async hasReachedTokenLimit(userId) {
        const activeTokenCount = await this.prisma.refreshToken.count({
            where: {
                userId,
                isRevoked: false,
                expiresAt: { gt: new Date() },
            },
        });
        return activeTokenCount >= this.MAX_REFRESH_TOKENS_PER_USER;
    }
    /**
     * Cleanup all expired tokens (can be run as a cron job)
     */
    async cleanupExpiredTokens() {
        const result = await this.prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { isRevoked: true },
                ],
            },
        });
        return result.count;
    }
};
exports.RefreshTokenService = RefreshTokenService;
exports.RefreshTokenService = RefreshTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_1.PrismaService !== "undefined" && database_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof core_1.EncryptionService !== "undefined" && core_1.EncryptionService) === "function" ? _b : Object])
], RefreshTokenService);
//# sourceMappingURL=refresh-token.service.js.map