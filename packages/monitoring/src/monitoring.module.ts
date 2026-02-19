// Monitoring Module - NestJS module configuration for monitoring dashboard
// Integrates all monitoring services and controllers

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitoringDashboardService } from './dashboard.service';
import { MonitoringDashboardController } from './dashboard.controller';

// TODO: Add CacheModule, QueueModule, WebSocketModule, A2AModule when ready

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [MonitoringDashboardController],
  providers: [MonitoringDashboardService],
  exports: [MonitoringDashboardService],
})
export class MonitoringModule {}