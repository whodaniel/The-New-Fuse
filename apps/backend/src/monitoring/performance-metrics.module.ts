import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PerformanceInterceptor } from '../interceptors/performance.interceptor';
import { MonitoringController } from './monitoring.controller';
import { PerformanceMetricsController } from './performance-metrics.controller';
import { PerformanceMetricsService } from './performance-metrics.service';

@Global()
@Module({
  providers: [
    PerformanceMetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
  controllers: [PerformanceMetricsController, MonitoringController],
  exports: [PerformanceMetricsService],
})
export class PerformanceMetricsModule {}
