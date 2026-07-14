var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let AdminModule = class AdminModule {
};
AdminModule = __decorate([
    Module({
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
], AdminModule);
export { AdminModule };
//# sourceMappingURL=admin.module.js.map