import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard.tsx';
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
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
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
