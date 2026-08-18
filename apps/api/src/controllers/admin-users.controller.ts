import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '@the-new-fuse/database/drizzle';
import { drizzleUserRepository } from '@the-new-fuse/database/drizzle/repositories';
import { membershipOverrides } from '@the-new-fuse/database/drizzle/schema';
import { AdminGuard } from '../guards/admin.guard';
import { SecureAuthGuard } from '../guards/secure-auth.guard';
import { AuditService } from '../services/audit.service';

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
@ApiTags('admin-users')
@Controller('admin/users')
@UseGuards(SecureAuthGuard, AdminGuard)
export class AdminUsersController {
  private readonly userRepository = drizzleUserRepository;

  constructor(
    private readonly auditService: AuditService,
    private readonly db: DatabaseService
  ) {}

  /**
   * Get all users with pagination and filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all users (admin)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async getAllUsers(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('role') role?: string,
    @Query('active') active?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    let users;

    if (role) {
      users = await this.userRepository.findByRole(role);
    } else if (active === 'true') {
      users = await this.userRepository.findActive();
    } else {
      users = await this.userRepository.findAll(parsedLimit, parsedOffset);
    }

    const total = await this.userRepository.count();

    return {
      data: users.map((user: any) => this.sanitizeUser(user)),
      total,
      limit: parsedLimit,
      offset: parsedOffset,
    };
  }

  /**
   * Get user by ID (admin view with full details)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Update user role (admin only)
   */
  @Put(':id/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() roleData: { role: string; roles?: string[] }
  ) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.userRepository.update(id, {
      role: roleData.role as any,
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
  @Post(':id/membership-override')
  @ApiOperation({ summary: 'Set membership override (admin only)' })
  @ApiResponse({ status: 200, description: 'Membership override created' })
  async setMembershipOverride(
    @Param('id') id: string,
    @Body()
    payload: {
      tier?: 'STARTER' | 'PRO' | 'ENTERPRISE' | string;
      reason?: string;
      expiresAt?: string;
      attachRole?: boolean;
    },
    @Req() req: any
  ) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tierRaw = String(payload?.tier || 'PRO')
      .trim()
      .toUpperCase();
    if (!['STARTER', 'PRO', 'ENTERPRISE'].includes(tierRaw)) {
      throw new BadRequestException('Invalid tier');
    }

    const expiresAt = payload?.expiresAt ? new Date(payload.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('Invalid expiresAt timestamp');
    }

    const escapeSqlLiteral = (value: string) => value.replace(/'/g, "''");
    const safeUserId = escapeSqlLiteral(id);
    const requesterSql =
      req?.user?.id !== undefined && req?.user?.id !== null
        ? `'${escapeSqlLiteral(String(req.user.id))}'`
        : 'NULL';

    // Revoke any existing active overrides for this user
    await this.db.executeRaw(
      `UPDATE membership_overrides
       SET status = 'REVOKED',
           revoked_at = now(),
           revoked_by_user_id = ${requesterSql},
           updated_at = now()
       WHERE user_id = '${safeUserId}'
         AND status = 'ACTIVE'`
    );

    const [override] = await this.db.client
      .insert(membershipOverrides)
      .values({
        userId: id,
        tier: tierRaw as any,
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
  @Post(':id/membership-override/revoke')
  @ApiOperation({ summary: 'Revoke membership override (admin only)' })
  @ApiResponse({ status: 200, description: 'Membership override revoked' })
  async revokeMembershipOverride(@Param('id') id: string, @Req() req: any) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const escapeSqlLiteral = (value: string) => value.replace(/'/g, "''");
    const safeUserId = escapeSqlLiteral(id);
    const requesterSql =
      req?.user?.id !== undefined && req?.user?.id !== null
        ? `'${escapeSqlLiteral(String(req.user.id))}'`
        : 'NULL';

    await this.db.executeRaw(
      `UPDATE membership_overrides
       SET status = 'REVOKED',
           revoked_at = now(),
           revoked_by_user_id = ${requesterSql},
           updated_at = now()
       WHERE user_id = '${safeUserId}'
         AND status = 'ACTIVE'`
    );

    const activeRows = await this.db.executeRaw<{ count?: number | string }>(
      `SELECT count(*)::int AS count
       FROM membership_overrides
       WHERE user_id = '${safeUserId}'
         AND status = 'ACTIVE'
         AND (expires_at IS NULL OR expires_at > now())`
    );
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
  @Get(':id/membership-override')
  @ApiOperation({ summary: 'List membership overrides for user (admin only)' })
  @ApiResponse({ status: 200, description: 'Membership overrides list' })
  async listMembershipOverrides(@Param('id') id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const escapeSqlLiteral = (value: string) => value.replace(/'/g, "''");
    const safeUserId = escapeSqlLiteral(id);
    const overrides = await this.db.executeRaw<Record<string, unknown>>(
      `SELECT *
       FROM membership_overrides
       WHERE user_id = '${safeUserId}'
       ORDER BY created_at DESC
       LIMIT 25`
    );
    return overrides;
  }

  /**
   * Activate user account
   */
  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate user account' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  async activateUser(@Param('id') id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
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
  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  async deactivateUser(@Param('id') id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
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
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
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
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  async getUserStats() {
    const total = await this.userRepository.count();
    const activeUsers = await this.userRepository.findActive();

    // Get role distribution
    const users = await this.userRepository.findAll();
    const roleDistribution: Record<string, number> = {};

    users.forEach((user: any) => {
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
  @Get('search/:query')
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchUsers(@Param('query') query: string) {
    // Simple search implementation - can be enhanced with full-text search
    const users = await this.userRepository.findAll();
    const filtered = users.filter(
      (user: any) =>
        user.email?.toLowerCase().includes(query.toLowerCase()) ||
        user.name?.toLowerCase().includes(query.toLowerCase()) ||
        user.username?.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.map((user: any) => this.sanitizeUser(user));
  }

  /**
   * Sanitize user object by removing sensitive fields
   */
  private sanitizeUser(user: any) {
    if (!user) return null;
    const { hashedPassword: _hashedPassword, refreshToken: _refreshToken, ...rest } = user;
    return rest;
  }
}
