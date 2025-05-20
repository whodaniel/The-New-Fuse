import { Module, Global } from '@nestjs/common';
import { MonitoringService } from './MonitoringService.js';
import { AlertManager } from './AlertManager.js';
import { MetricsCollector } from './MetricsCollector.js';
import { UnifiedMonitoringService } from './unified-monitoring.service.js';
import { DatabaseModule } from '@the-new-fuse/database';

@Global()
@Module({
  imports: [
    DatabaseModule
  ],
  providers: [
    MonitoringService,
    AlertManager,
    MetricsCollector,
    UnifiedMonitoringService
  ],
  exports: [
    MonitoringService,
    AlertManager,
    MetricsCollector,
    UnifiedMonitoringService
  ]
})
export class MonitoringModule {}
