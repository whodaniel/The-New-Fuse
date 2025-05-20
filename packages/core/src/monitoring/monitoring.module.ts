import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LoggingModule } from '../logging/logging.module.js';
import { ErrorTrackingService } from './ErrorTrackingService.js';
import { ErrorAlertService } from './error-alert.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { PerformanceMonitoringService } from './performance-monitoring.service.js';
import { ServiceCommunicationMonitor } from './service-communication-monitor.js';
import { BusinessMetricsService } from './business-metrics.service.js';
import { SystemResourceMonitorService } from './system-resource-monitor.service.js';
import { ServiceDependencyHealthService } from './service-dependency-health.service.js';
import { AutoScalingService } from './auto-scaling.service.js';
import { APP_INTERCEPTOR, APP_MIDDLEWARE } from '@nestjs/core';
import { CorrelationIdInterceptor } from '../interceptors/correlation-id.interceptor.js';
import { CorrelationIdMiddleware } from '../middleware/correlation-id.middleware.js';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    PrismaModule,
    LoggingModule
  ],
  providers: [
    ErrorTrackingService,
    ErrorAlertService,
    MetricsService,
    PerformanceMonitoringService,
    ServiceCommunicationMonitor,
    BusinessMetricsService,
    SystemResourceMonitorService,
    ServiceDependencyHealthService,
    AutoScalingService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor
    },
    {
      provide: APP_MIDDLEWARE,
      useClass: CorrelationIdMiddleware
    }
  ],
  exports: [
    ErrorTrackingService,
    ErrorAlertService,
    MetricsService,
    PerformanceMonitoringService,
    ServiceCommunicationMonitor,
    BusinessMetricsService,
    SystemResourceMonitorService,
    ServiceDependencyHealthService,
    AutoScalingService
  ]
})
export class MonitoringModule {}
