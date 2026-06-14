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
exports.AdminUsersController = void 0;
const common_1 = require("@nestjs/common");
// @ts-ignore
// @ts-ignore
const swagger_1 = require("@nestjs/swagger");
const drizzle_1 = require("@the-new-fuse/database/drizzle");
const repositories_1 = require("@the-new-fuse/database/drizzle/repositories");
const schema_1 = require("@the-new-fuse/database/drizzle/schema");
const admin_guard_1 = require("../guards/admin.guard");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const audit_service_1 = require("../services/audit.service");
/**
 * Admin Users Controller
 *
 * Handles administrative operations for user management including:
 * - Viewing all users across the platform
 * - Updating user roles and permissions
 * - Activating/deactivating user accounts
 * - Viewing user activity and statistics
 *
 * All endpoints require SUPER_ADMIN or admin role access.
 */
let AdminUsersController = class AdminUsersController {
    constructor(auditService, db) {
        this.auditService = auditService;
        this.db = db;
        this.userRepository = repositories_1.drizzleUserRepository;
    }
    /**
     * Get all users with pagination and filtering
     */
    async getAllUsers(limit, offset, role, active) {
        const parsedLimit = limit ? parseInt(limit, 10) : 100;
        const parsedOffset = offset ? parseInt(offset, 10) : 0;
        let users;
        if (role) {
            users = await this.userRepository.findByRole(role);
        }
        else if (active === 'true') {
            users = await this.userRepository.findActive();
        }
        else {
            users = await this.userRepository.findAll(parsedLimit, parsedOffset);
        }
        const total = await this.userRepository.count();
        return {
            data: users.map((user) => this.sanitizeUser(user)),
            total,
            limit: parsedLimit,
            offset: parsedOffset,
        };
    }
    /**
     * Get user by ID (admin view with full details)
     */
    async getUserById(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.sanitizeUser(user);
    }
    /**
     * Update user role (admin only)
     */
    async updateUserRole(id, roleData) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updatedUser = await this.userRepository.update(id, {
            role: roleData.role,
            roles: roleData.roles || [roleData.role],
        });
        // Audit log
        await this.auditService.log('user.role_updated', {
            resourceType: 'user',
            resourceId: id,
            details: {
                oldRole: user.role,
                oldRoles: user.roles,
                newRole: roleData.role,
                newRoles: roleData.roles || [roleData.role],
            },
            status: 'success',
        });
        return this.sanitizeUser(updatedUser);
    }
    /**
     * Set membership override (server-side only).
     * This bypasses payment processors and marks a user as PRO/ENTERPRISE.
     */
    async setMembershipOverride(id, payload, req) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const tierRaw = String(payload?.tier || 'PRO')
            .trim()
            .toUpperCase();
        if (!['STARTER', 'PRO', 'ENTERPRISE'].includes(tierRaw)) {
            throw new common_1.BadRequestException('Invalid tier');
        }
        const expiresAt = payload?.expiresAt ? new Date(payload.expiresAt) : null;
        if (expiresAt && Number.isNaN(expiresAt.getTime())) {
            throw new common_1.BadRequestException('Invalid expiresAt timestamp');
        }
        const escapeSqlLiteral = (value) => value.replace(/'/g, "''");
        const safeUserId = escapeSqlLiteral(id);
        const requesterSql = req?.user?.id !== undefined && req?.user?.id !== null
            ? `'${escapeSqlLiteral(String(req.user.id))}'`
            : 'NULL';
        // Revoke any existing active overrides for this user
        await this.db.executeRaw(`UPDATE membership_overrides
       SET status = 'REVOKED',
           revoked_at = now(),
           revoked_by_user_id = ${requesterSql},
           updated_at = now()
       WHERE user_id = '${safeUserId}'
         AND status = 'ACTIVE'`);
        const [override] = await this.db.client
            .insert(schema_1.membershipOverrides)
            .values({
            userId: id,
            tier: tierRaw,
            status: 'ACTIVE',
            reason: payload?.reason,
            createdByUserId: req?.user?.id,
            expiresAt: expiresAt || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning();
        if (payload?.attachRole !== false) {
            const roles = Array.isArray(user.roles) ? [...user.roles] : [];
            if (!roles.includes('MEMBERSHIP_OVERRIDE')) {
                roles.push('MEMBERSHIP_OVERRIDE');
                await this.userRepository.update(id, { roles });
            }
        }
        await this.auditService.log('user.membership_override_set', {
            resourceType: 'user',
            resourceId: id,
            details: {
                tier: tierRaw,
                expiresAt: expiresAt ? expiresAt.toISOString() : null,
                reason: payload?.reason || null,
            },
            status: 'success',
        });
        return override;
    }
    /**
     * Revoke membership override for a user.
     */
    async revokeMembershipOverride(id, req) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const escapeSqlLiteral = (value) => value.replace(/'/g, "''");
        const safeUserId = escapeSqlLiteral(id);
        const requesterSql = req?.user?.id !== undefined && req?.user?.id !== null
            ? `'${escapeSqlLiteral(String(req.user.id))}'`
            : 'NULL';
        await this.db.executeRaw(`UPDATE membership_overrides
       SET status = 'REVOKED',
           revoked_at = now(),
           revoked_by_user_id = ${requesterSql},
           updated_at = now()
       WHERE user_id = '${safeUserId}'
         AND status = 'ACTIVE'`);
        const activeRows = await this.db.executeRaw(`SELECT count(*)::int AS count
       FROM membership_overrides
       WHERE user_id = '${safeUserId}'
         AND status = 'ACTIVE'
         AND (expires_at IS NULL OR expires_at > now())`);
        const active = Number(activeRows?.[0]?.count || 0);
        if (active === 0) {
            const roles = Array.isArray(user.roles)
                ? user.roles.filter((r) => r !== 'MEMBERSHIP_OVERRIDE')
                : [];
            await this.userRepository.update(id, { roles });
        }
        await this.auditService.log('user.membership_override_revoked', {
            resourceType: 'user',
            resourceId: id,
            details: {},
            status: 'success',
        });
        return { success: true };
    }
    /**
     * List membership overrides for a user.
     */
    async listMembershipOverrides(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const escapeSqlLiteral = (value) => value.replace(/'/g, "''");
        const safeUserId = escapeSqlLiteral(id);
        const overrides = await this.db.executeRaw(`SELECT *
       FROM membership_overrides
       WHERE user_id = '${safeUserId}'
       ORDER BY created_at DESC
       LIMIT 25`);
        return overrides;
    }
    /**
     * Activate user account
     */
    async activateUser(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const activated = await this.userRepository.activate(id);
        // Audit log
        await this.auditService.log('user.activated', {
            resourceType: 'user',
            resourceId: id,
            details: { previousStatus: user.isActive },
            status: 'success',
        });
        return this.sanitizeUser(activated);
    }
    /**
     * Deactivate user account
     */
    async deactivateUser(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const deactivated = await this.userRepository.deactivate(id);
        // Audit log
        await this.auditService.log('user.deactivated', {
            resourceType: 'user',
            resourceId: id,
            details: { previousStatus: user.isActive },
            status: 'success',
        });
        return this.sanitizeUser(deactivated);
    }
    /**
     * Delete user (soft delete)
     */
    async deleteUser(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const deleted = await this.userRepository.softDelete(id);
        // Audit log
        await this.auditService.log('user.deleted', {
            resourceType: 'user',
            resourceId: id,
            details: { email: user.email, role: user.role },
            status: 'success',
        });
        return { message: 'User deleted successfully', deleted };
    }
    /**
     * Get user statistics
     */
    async getUserStats() {
        const total = await this.userRepository.count();
        const activeUsers = await this.userRepository.findActive();
        // Get role distribution
        const users = await this.userRepository.findAll();
        const roleDistribution = {};
        users.forEach((user) => {
            const role = user.role || 'USER';
            roleDistribution[role] = (roleDistribution[role] || 0) + 1;
        });
        return {
            total,
            active: activeUsers.length,
            inactive: total - activeUsers.length,
            roleDistribution,
        };
    }
    /**
     * Search users
     */
    async searchUsers(query) {
        // Simple search implementation - can be enhanced with full-text search
        const users = await this.userRepository.findAll();
        const filtered = users.filter((user) => user.email?.toLowerCase().includes(query.toLowerCase()) ||
            user.name?.toLowerCase().includes(query.toLowerCase()) ||
            user.username?.toLowerCase().includes(query.toLowerCase()));
        return filtered.map((user) => this.sanitizeUser(user));
    }
    /**
     * Sanitize user object by removing sensitive fields
     */
    sanitizeUser(user) {
        if (!user)
            return null;
        const { hashedPassword: _hashedPassword, refreshToken: _refreshToken, ...rest } = user;
        return rest;
    }
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users (admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of all users' }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('offset')),
    __param(2, (0, common_1.Query)('role')),
    __param(3, (0, common_1.Query)('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID (admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Put)(':id/role'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user role' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Post)(':id/membership-override'),
    (0, swagger_1.ApiOperation)({ summary: 'Set membership override (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Membership override created' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "setMembershipOverride", null);
__decorate([
    (0, common_1.Post)(':id/membership-override/revoke'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke membership override (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Membership override revoked' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "revokeMembershipOverride", null);
__decorate([
    (0, common_1.Get)(':id/membership-override'),
    (0, swagger_1.ApiOperation)({ summary: 'List membership overrides for user (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Membership overrides list' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "listMembershipOverrides", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate user account' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User activated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "activateUser", null);
__decorate([
    (0, common_1.Post)(':id/deactivate'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate user account' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deactivated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "deactivateUser", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user (soft delete)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('search/:query'),
    (0, swagger_1.ApiOperation)({ summary: 'Search users' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results' }),
    __param(0, (0, common_1.Param)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "searchUsers", null);
exports.AdminUsersController = AdminUsersController = __decorate([
    (0, swagger_1.ApiTags)('admin-users'),
    (0, common_1.Controller)('admin/users'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [audit_service_1.AuditService,
        drizzle_1.DatabaseService])
], AdminUsersController);
//# sourceMappingURL=admin-users.controller.js.map