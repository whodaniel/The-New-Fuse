import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { execSync } from 'child_process';
import { Permission } from '@the-new-fuse/types';
import { RoleService } from '../services/role.service';
import { AuditService } from '../services/audit.service';
import { MetricsService } from '../services/metrics.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly roleService: RoleService,
    private readonly auditService: AuditService,
    private readonly metricsService: MetricsService
  ) {}
  @Post('run-script')
  async runScript(@Body('script') script: string) {
    try {
      const output = execSync(`yarn fuse ${script}`, { encoding: 'utf-8' });
      return { success: true, output };
    } catch (error) {
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
