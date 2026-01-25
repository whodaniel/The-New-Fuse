import { Module } from '@nestjs/common';
import { UsersModule } from '../../users/users.module';
import { AgentModule } from '../agent/agent.module';
import { AdminAgentsController } from './controllers/admin-agents.controller';
import { AdminAuditLogsController } from './controllers/admin-audit-logs.controller';
import { AdminBackupController } from './controllers/admin-backup.controller';
import { AdminConfigController } from './controllers/admin-config.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminDatabaseController } from './controllers/admin-database.controller';
import { AdminMetricsController } from './controllers/admin-metrics.controller';
import { AdminSettingsController } from './controllers/admin-settings.controller';
import { AdminUsersController } from './controllers/admin-users.controller';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { SystemMetricsModule } from '../system-metrics/system-metrics.module';

@Module({
  imports: [AgentModule, UsersModule, ConfigurationModule, AuditLogsModule, SystemMetricsModule],
  controllers: [
    AdminAgentsController,
    AdminBackupController,
    AdminUsersController,
    AdminDatabaseController,
    AdminConfigController,
    AdminSettingsController,
    AdminAuditLogsController,
    AdminMetricsController,
    AdminDashboardController,
  ],
})
export class AdminModule {}
