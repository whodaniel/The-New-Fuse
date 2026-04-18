import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CacheService } from '../../cache/cache.service.js';
import { AdminConfigController } from '../../controllers/admin-config.controller.js';
import { AdminMetricsController } from '../../controllers/admin-metrics.controller.js';
import { AdminOpenClawRuntimeController } from '../../controllers/admin-openclaw-runtime.controller.js';
import { AdminUsersController } from '../../controllers/admin-users.controller.js';
import { AdminController } from '../../controllers/admin.controller.js';
import { SecurityLoggingService } from '../../security/security-logging.service.js';
import { AuditService } from '../../services/audit.service.js';
import { MetricsService } from '../../services/metrics.service.js';
import { OpenClawRuntimeService } from '../../services/openclaw-runtime.service.js';
import { RoleService } from '../../services/role.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { UnifiedLedgerModule } from '../unified-ledger/unified-ledger.module.js';
import { ChronologicalProcessesService } from './chronological-processes.service.js';

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
 * - User management (admin operations)
 * - Real-time system performance monitoring
 * - Configuration management
 */
@Module({
  imports: [JwtModule, AuthModule, UnifiedLedgerModule],
  controllers: [
    AdminController,
    AdminUsersController,
    AdminMetricsController,
    AdminConfigController,
    AdminOpenClawRuntimeController,
  ],
  providers: [
    RoleService,
    AuditService,
    MetricsService,
    SecurityLoggingService,
    CacheService,
    OpenClawRuntimeService,
    ChronologicalProcessesService,
  ],
  exports: [RoleService, AuditService, MetricsService],
})
export class AdminModule {}
