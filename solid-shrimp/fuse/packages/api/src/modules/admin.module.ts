import { Module } from '@nestjs/common';
import { AdminAuditLogsController } from '../controllers/admin/admin-audit-logs.controller';
import { AdminConfigController } from '../controllers/admin/admin-config.controller';
import { AdminMetricsController } from '../controllers/admin/admin-metrics.controller';
import { AdminSettingsController } from '../controllers/admin/admin-settings.controller';
import { ApiLogsRepository } from '../repositories/api-logs.repository';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';
import { ConfigurationRepository } from '../repositories/configuration.repository';
import { AdminAuditLogsService } from '../services/admin-audit-logs.service';
import { AdminConfigurationService } from '../services/admin-configuration.service';
import { SystemMetricsService } from '../services/system-metrics.service';
import { AuthModule } from './auth/auth.module';

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
