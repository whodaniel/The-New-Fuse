import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard.js';
import { execSync } from 'child_process';
import { Permission } from '@the-new-fuse/types';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  @Post('run-script')
  async runScript(@Body('script') script: string) {
    try {
      const output = execSync(`yarn fuse ${script}`, { encoding: 'utf-8' });
      return { success: true, output };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('roles')
  async getRoles() {
    return this.roleService.getAllRoles();
  }

  @Put('roles/:roleId/permissions')
  async updateRolePermissions(
    @Param('roleId') roleId: string,
    @Body('permissions') permissions: Permission[]
  ) {
    return this.roleService.updateRolePermissions(roleId, permissions);
  }

  @Get('audit-logs')
  async getAuditLogs() {
    return this.auditService.getLogs();
  }

  @Get('metrics')
  async getSystemMetrics() {
    return this.metricsService.getSystemMetrics();
  }
}
