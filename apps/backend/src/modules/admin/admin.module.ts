import { Module } from '@nestjs/common';
import { UsersModule } from '../../users/users.module.js';
import { AgentModule } from '../agent/agent.module.js';
import { AdminAgentsController } from './controllers/admin-agents.controller.js';
import { AdminAuditLogsController } from './controllers/admin-audit-logs.controller.js';
import { AdminBackupController } from './controllers/admin-backup.controller.js';
import { AdminConfigController } from './controllers/admin-config.controller.js';
import { AdminDashboardController } from './controllers/admin-dashboard.controller.js';
import { AdminDatabaseController } from './controllers/admin-database.controller.js';
import { AdminMetricsController } from './controllers/admin-metrics.controller.js';
import { AdminSettingsController } from './controllers/admin-settings.controller.js';
import { AdminUsersController } from './controllers/admin-users.controller.js';

import { AuditLogsModule } from '../audit-logs/audit-logs.module.js';
import { ConfigurationModule } from '../configuration/configuration.module.js';
import { SystemMetricsModule } from '../system-metrics/system-metrics.module.js';

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
