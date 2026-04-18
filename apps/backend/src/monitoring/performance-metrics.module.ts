import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PerformanceInterceptor } from '../interceptors/performance.interceptor.js';
import { MonitoringController } from './monitoring.controller.js';
import { PerformanceMetricsController } from './performance-metrics.controller.js';
import { PerformanceMetricsService } from './performance-metrics.service.js';

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
