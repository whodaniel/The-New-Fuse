import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { drizzleUserRepository } from '@the-new-fuse/database/drizzle/repositories';
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
  constructor(
    private readonly userRepository = drizzleUserRepository,
    private readonly auditService: AuditService
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
      data: users.map((user) => this.sanitizeUser(user)),
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
  @Get('search/:query')
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchUsers(@Param('query') query: string) {
    // Simple search implementation - can be enhanced with full-text search
    const users = await this.userRepository.findAll();
    const filtered = users.filter(
      (user) =>
        user.email?.toLowerCase().includes(query.toLowerCase()) ||
        user.name?.toLowerCase().includes(query.toLowerCase()) ||
        user.username?.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.map((user) => this.sanitizeUser(user));
  }

  /**
   * Sanitize user object by removing sensitive fields
   */
  private sanitizeUser(user: any) {
    if (!user) return null;
    const { hashedPassword, refreshToken, ...rest } = user;
    return rest;
  }
}
