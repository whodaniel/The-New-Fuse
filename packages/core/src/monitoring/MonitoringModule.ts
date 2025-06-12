import { Module, Global } from '@nestjs/common';
import { MonitoringService } from './MonitoringService.tsx';
import { AlertManager } from './AlertManager.tsx';
import { MetricsCollector } from './MetricsCollector.tsx';
import { UnifiedMonitoringService } from './unified-monitoring.service.tsx';
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
