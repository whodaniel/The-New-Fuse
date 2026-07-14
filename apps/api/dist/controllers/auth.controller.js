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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_policy_1 = require("../auth/auth-policy");
const auth_dto_1 = require("../dtos/auth.dto");
const auth_guard_1 = require("../guards/auth.guard");
const auth_service_1 = require("../services/auth.service");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto, req) {
        const ipAddress = req?.ip || req?.socket?.remoteAddress;
        return this.authService.login(loginDto, { ipAddress });
    }
    async register(registerDto, req) {
        const ipAddress = req?.ip || req?.socket?.remoteAddress;
        return this.authService.register(registerDto, { ipAddress });
    }
    async supabaseExchange(dto) {
        return this.authService.supabaseExchange(dto);
    }
    async invitePolicy() {
        return this.authService.getInvitePolicy();
    }
    async generateInviteCode(dto, req) {
        this.assertAdmin(req?.user);
        return this.authService.generateInviteCode(dto, req?.user?.id);
    }
    async listInviteCodes(req) {
        this.assertAdmin(req?.user);
        return this.authService.listInviteCodes();
    }
    async disableInviteCode(inviteId, req) {
        this.assertAdmin(req?.user);
        if (!inviteId)
            throw new common_1.BadRequestException('Invite ID is required');
        return this.authService.disableInviteCode(inviteId);
    }
    async refresh(body) {
        const refreshToken = body?.refreshToken || body?.refresh_token;
        if (!refreshToken) {
            throw new common_1.BadRequestException('Refresh token is required');
        }
        return this.authService.refresh(refreshToken);
    }
    async logout() {
        await this.authService.logout();
        return {
            success: true,
            message: 'Successfully logged out',
            timestamp: new Date().toISOString(),
        };
    }
    async me(req) {
        const currentUser = req.user;
        return {
            id: currentUser.id,
            email: currentUser.email,
            username: currentUser.username,
            name: currentUser.name,
            displayName: currentUser.name || currentUser.username,
            role: currentUser.role,
            roles: currentUser.roles,
            isActive: currentUser.isActive,
            createdAt: currentUser.createdAt,
            updatedAt: currentUser.updatedAt,
            preferences: currentUser.preferences || {
                theme: 'system',
                notifications: true,
            },
        };
    }
    async updateMe(req, body) {
        return this.authService.updateCurrentUserProfile(req.user.id, body);
    }
    async session(req) {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return { authenticated: false, user: null };
        }
        const token = authHeader.slice(7);
        try {
            const user = await this.authService.validateToken(token);
            return {
                authenticated: true,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    name: user.name,
                    role: user.role,
                    roles: user.roles,
                },
            };
        }
        catch {
            return { authenticated: false, user: null };
        }
    }
    assertAdmin(user) {
        const isAdmin = (0, auth_policy_1.hasAuthorizationLevel)(user || {}, 'admin');
        if (!isAdmin)
            throw new common_1.ForbiddenException('Admin access required');
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'User login' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'User registration' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Registration successful' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('supabase'),
    (0, swagger_1.ApiOperation)({ summary: 'Exchange Supabase token for platform JWT' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Exchange successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SupabaseAuthDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "supabaseExchange", null);
__decorate([
    (0, common_1.Get)('invite-policy'),
    (0, swagger_1.ApiOperation)({ summary: 'Get invite-only registration policy state' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invite policy payload' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "invitePolicy", null);
__decorate([
    (0, common_1.Post)('invite-codes/generate'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a registration invite code (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Invite code generated' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.GenerateInviteCodeDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "generateInviteCode", null);
__decorate([
    (0, common_1.Get)('invite-codes'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'List registration invite codes (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invite code list' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "listInviteCodes", null);
__decorate([
    (0, common_1.Post)('invite-codes/:inviteId/disable'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Disable registration invite code (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invite code disabled' }),
    __param(0, (0, common_1.Param)('inviteId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disableInviteCode", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token refreshed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'User logout' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logout successful' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User profile retrieved successfully' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User profile updated successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Get)('session'),
    (0, swagger_1.ApiOperation)({ summary: 'Get lightweight auth session status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session payload' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "session", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map