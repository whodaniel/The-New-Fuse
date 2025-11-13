"use strict";
/**
 * Enhanced Auth Controller with OAuth Support
 *
 * Add these endpoints to your existing auth.controller.ts
 */
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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    // ============================================================================
    // OAuth Endpoints
    // ============================================================================
    /**
     * Initiate Google OAuth flow
     */
    async googleLogin() {
        // Guard redirects to Google
    }
    /**
     * Google OAuth callback
     */
    async googleCallback(req, res) {
        // User is available in req.user (from GoogleStrategy)
        const user = req.user;
        // Generate JWT tokens
        const tokens = await this.authService.generateTokens(user);
        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken});
  }

  /**
   * Initiate GitHub OAuth flow
   */
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Guard redirects to GitHub
  }

  /**
   * GitHub OAuth callback
   */
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    // User is available in req.user (from GitHubStrategy)
    const user = req.user as any;

    // Generate JWT tokens
    const tokens = await this.authService.generateTokens(user);
`);
        // Redirect to frontend with token`
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        `
    res.redirect(${frontendUrl}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`;
        ;
    }
    // ============================================================================
    // Email/Password Endpoints (Keep existing ones)
    // ============================================================================
    // POST /auth/register - Already exists in auth.service.ts
    // POST /auth/login - Already exists in auth.service.ts
    // POST /auth/refresh - Already exists in auth.service.ts
    // ============================================================================
    // New Password Management Endpoints
    // ============================================================================
    /**
     * Request password reset email
     */
    async forgotPassword(email) {
        await this.authService.requestPasswordReset(email);
        return { message: 'If the email exists, a password reset link has been sent' };
    }
    /**
     * Reset password with token
     */
    async resetPassword(token, password) {
        await this.authService.resetPassword(token, password);
        return { message: 'Password reset successful' };
    }
    // ============================================================================
    // Email Verification Endpoints
    // ============================================================================
    /**
     * Resend verification email
     */
    async resendVerification(req) {
        const user = req.user;
        await this.authService.sendVerificationEmail(user.id);
        return { message: 'Verification email sent' };
    }
    /**
     * Verify email with token
     */
    async verifyEmail(token) {
        await this.authService.verifyEmail(token);
        return { message: 'Email verified successfully' };
    }
    // ============================================================================
    // User Info Endpoint
    // ============================================================================
    /**
     * Get current user
     */
    async getCurrentUser(req) {
        const user = req.user;
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            emailVerified: user.emailVerified,
            twoFactorEnabled: user.twoFactorEnabled || false,
            role: user.role,
        };
    }
    /**
     * Logout (invalidate session)
     */
    async logout(req) {
        const user = req.user;
        // TODO: Implement session invalidation in database
        return { message: 'Logged out successfully' };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleLogin", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('token')),
    __param(1, (0, common_1.Body)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('resend-verification'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerification", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.enhanced.js.map