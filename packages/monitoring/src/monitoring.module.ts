import { Module } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitoringService } from './(monitoring as any).service.js';
import { PrismaModule } from '../../core/src/database/(prisma as any).module.js';
import { ErrorTrackingService } from './error-(tracking as any).service.js';
import { SecurityLoggingService } from './security-(logging as any).service.js';
import { PerformanceMonitoringService } from './performance-(monitoring as any).service.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
  ],
  providers: [
    MonitoringService,
    ErrorTrackingService,
    SecurityLoggingService,
    PerformanceMonitoringService
  ],
  exports: [
    MonitoringService,
    ErrorTrackingService,
    SecurityLoggingService,
    PerformanceMonitoringService
  ]
})

export class MonitoringModule {}