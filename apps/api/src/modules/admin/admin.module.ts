import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CacheService } from '../../cache/cache.service';
import { AdminConfigController } from '../../controllers/admin-config.controller';
import { AdminMetricsController } from '../../controllers/admin-metrics.controller';
import { AdminOpenClawRuntimeController } from '../../controllers/admin-openclaw-runtime.controller';
import { AdminUsersController } from '../../controllers/admin-users.controller';
import { AdminController } from '../../controllers/admin.controller';
import { SecurityLoggingService } from '../../security/security-logging.service';
import { AuditService } from '../../services/audit.service';
import { MetricsService } from '../../services/metrics.service';
import { OpenClawRuntimeService } from '../../services/openclaw-runtime.service';
import { RoleService } from '../../services/role.service';
import { AuthModule } from '../auth/auth.module';
import { UnifiedLedgerModule } from '../unified-ledger/unified-ledger.module';
import { ChronologicalProcessesService } from './chronological-processes.service';

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
