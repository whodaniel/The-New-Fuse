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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const refresh_token_service_1 = require("./refresh-token.service");
const auth_service_1 = require("../auth/auth.service");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
let RefreshTokenController = class RefreshTokenController {
    refreshTokenService;
    authService;
    constructor(refreshTokenService, authService) {
        this.refreshTokenService = refreshTokenService;
        this.authService = authService;
    }
    async refreshToken(body, req) {
        try {
            // Validate the refresh token
            const tokenPayload = await this.refreshTokenService.validateRefreshToken(body.refreshToken);
            // Generate new access token
            const accessToken = await this.authService.generateAccessToken({
                sub: tokenPayload.userId,
                type: 'access',
            });
            // Rotate the refresh token (generate new one, revoke old)
            const newRefreshToken = await this.refreshTokenService.rotateRefreshToken(body.refreshToken, {
                userId: tokenPayload.userId,
                deviceInfo: body.deviceInfo || tokenPayload.deviceInfo,
                ipAddress: req.ip || tokenPayload.ipAddress,
                userAgent: req.get('User-Agent') || tokenPayload.userAgent,
            });
            return {
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn: 900, // 15 minutes
                tokenType: 'Bearer',
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async revokeToken(body) {
        try {
            await this.refreshTokenService.revokeRefreshToken(body.refreshToken);
            return { message: 'Token revoked successfully' };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async revokeAllTokens(req) {
        const userId = req.user?.sub || req.user?.id;
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authenticated');
        }
        await this.refreshTokenService.revokeAllRefreshTokens(userId);
        return { message: 'All tokens revoked successfully' };
    }
    async revokeAllUserTokens(userId, req) {
        // Check if user is admin (implement your admin check logic)
        const currentUser = req.user;
        if (!currentUser?.roles?.includes('ADMIN') && !currentUser?.roles?.includes('SUPER_ADMIN')) {
            throw new common_1.UnauthorizedException('Insufficient permissions');
        }
        await this.refreshTokenService.revokeAllRefreshTokens(userId);
        return { message: 'All tokens revoked successfully' };
    }
    async getActiveTokens(req) {
        const userId = req.user?.sub || req.user?.id;
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authenticated');
        }
        return this.refreshTokenService.getUserRefreshTokens(userId);
    }
    async cleanupExpiredTokens(req) {
        // Check if user is admin
        const currentUser = req.user;
        if (!currentUser?.roles?.includes('ADMIN') && !currentUser?.roles?.includes('SUPER_ADMIN')) {
            throw new common_1.UnauthorizedException('Insufficient permissions');
        }
        const count = await this.refreshTokenService.cleanupExpiredTokens();
        return {
            message: 'Cleanup completed successfully',
            count,
        };
    }
};
exports.RefreshTokenController = RefreshTokenController;
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Refresh access token',
        description: 'Generate a new access token using a valid refresh token'
    }),
    (0, swagger_1.ApiBody)({ type: refresh_token_dto_1.RefreshTokenRequestDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'New tokens generated successfully',
        type: refresh_token_dto_1.RefreshTokenResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid or expired refresh token',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenRequestDto, Object]),
    __metadata("design:returntype", Promise)
], RefreshTokenController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('revoke'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Revoke refresh token',
        description: 'Revoke a specific refresh token'
    }),
    (0, swagger_1.ApiBody)({ type: refresh_token_dto_1.RevokeTokenRequestDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Token revoked successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid refresh token',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RevokeTokenRequestDto]),
    __metadata("design:returntype", Promise)
], RefreshTokenController.prototype, "revokeToken", null);
__decorate([
    (0, common_1.Post)('revoke-all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Revoke all refresh tokens',
        description: 'Revoke all refresh tokens for the authenticated user'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All tokens revoked successfully',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RefreshTokenController.prototype, "revokeAllTokens", null);
__decorate([
    (0, common_1.Post)('revoke-all/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Revoke all refresh tokens for user (Admin)',
        description: 'Admin endpoint to revoke all refresh tokens for a specific user'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All tokens revoked successfully',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RefreshTokenController.prototype, "revokeAllUserTokens", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get active refresh tokens',
        description: 'Get all active refresh tokens for the authenticated user'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Active tokens retrieved successfully',
        type: [refresh_token_dto_1.ActiveTokenResponseDto],
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RefreshTokenController.prototype, "getActiveTokens", null);
__decorate([
    (0, common_1.Delete)('cleanup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Cleanup expired tokens (Admin)',
        description: 'Admin endpoint to cleanup all expired refresh tokens'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cleanup completed successfully',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RefreshTokenController.prototype, "cleanupExpiredTokens", null);
exports.RefreshTokenController = RefreshTokenController = __decorate([
    (0, swagger_1.ApiTags)('Authentication - Refresh Tokens'),
    (0, common_1.Controller)('auth/refresh-token'),
    __metadata("design:paramtypes", [refresh_token_service_1.RefreshTokenService,
        auth_service_1.AuthService])
], RefreshTokenController);
//# sourceMappingURL=refresh-token.controller.js.map