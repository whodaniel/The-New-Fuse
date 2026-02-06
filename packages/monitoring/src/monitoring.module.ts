// Monitoring Module - NestJS module configuration for monitoring dashboard
// Integrates all monitoring services and controllers

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitoringDashboardController } from './dashboard.controller';
import { MonitoringDashboardService } from './dashboard.service';

// Import other service modules (these would need to be created as proper modules)
// import { CacheModule } from '../../cache/src/cache.module';
// import { QueueModule } from '../../job-queue/src/queue.module';
// import { WebSocketModule } from '../../websocket/src/websocket.module';
// import { A2AModule } from '../../a2a-enhanced/src/a2a.module';

@Module({
  imports: [
    ConfigModule,
    // CacheModule,
    // QueueModule,
    // WebSocketModule,
    // A2AModule,
  ],
  controllers: [MonitoringDashboardController],
  providers: [MonitoringDashboardService],
  exports: [MonitoringDashboardService],
})
export class MonitoringModule {}
