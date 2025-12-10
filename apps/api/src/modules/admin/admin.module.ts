import { Module } from '@nestjs/common';
import { AdminController } from '../../controllers/admin.controller';
import { AuditService } from '../../services/audit.service';
import { MetricsService } from '../../services/metrics.service';
import { RoleService } from '../../services/role.service';

/**
 * Admin Module
 *
 * Handles all administrative operations including system management,
 * role-based access control, audit logging, and system monitoring.
 *
 * This module provides:
 * - System script execution capabilities
 * - Role and permission management
 * - Audit log retrieval and analysis
 * - System metrics and monitoring
 */
@Module({
  controllers: [AdminController],
  providers: [RoleService, AuditService, MetricsService],
  exports: [RoleService, AuditService, MetricsService],
})
export class AdminModule {}
