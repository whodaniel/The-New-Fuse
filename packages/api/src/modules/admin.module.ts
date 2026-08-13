import { Module } from '@nestjs/common';
import { AdminAuditLogsController } from '../controllers/admin/admin-audit-logs.controller.js';
import { AdminConfigController } from '../controllers/admin/admin-config.controller.js';
import { AdminMetricsController } from '../controllers/admin/admin-metrics.controller.js';
import { AdminSettingsController } from '../controllers/admin/admin-settings.controller.js';
import { ApiLogsRepository } from '../repositories/api-logs.repository.js';
import { AuditLogsRepository } from '../repositories/audit-logs.repository.js';
import { ConfigurationRepository } from '../repositories/configuration.repository.js';
import { AdminAuditLogsService } from '../services/admin-audit-logs.service.js';
import { AdminConfigurationService } from '../services/admin-configuration.service.js';
import { SystemMetricsService } from '../services/system-metrics.service.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [
    AdminAuditLogsController,
    AdminConfigController,
    AdminSettingsController,
    AdminMetricsController,
  ],
  providers: [
    AdminAuditLogsService,
    AuditLogsRepository,
    AdminConfigurationService,
    ConfigurationRepository,
    SystemMetricsService,
    ApiLogsRepository,
  ],
  exports: [AdminAuditLogsService, AdminConfigurationService, SystemMetricsService],
})
export class AdminModule {}
