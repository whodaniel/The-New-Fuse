import { Module } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitoringService } from './(monitoring as any).service';
import { PrismaModule } from '../../core/src/database/(prisma as any).module';
import { ErrorTrackingService } from './error-(tracking as any).service';
import { SecurityLoggingService } from './security-(logging as any).service';
import { PerformanceMonitoringService } from './performance-(monitoring as any).service';

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