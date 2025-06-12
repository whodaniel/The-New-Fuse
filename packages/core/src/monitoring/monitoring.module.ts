import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LoggingModule } from '../logging/logging.module.js';
import { ErrorTrackingService } from './ErrorTrackingService.tsx';
import { ErrorAlertService } from './error-alert.service.tsx';
import { MetricsService } from '../metrics/metrics.service.tsx';
import { PerformanceMonitoringService } from './performance-monitoring.service.tsx';
import { ServiceCommunicationMonitor } from './service-communication-monitor.tsx';
import { BusinessMetricsService } from './business-metrics.service.tsx';
import { SystemResourceMonitorService } from './system-resource-monitor.service.tsx';
import { ServiceDependencyHealthService } from './service-dependency-health.service.tsx';
import { AutoScalingService } from './auto-scaling.service.tsx';
import { APP_INTERCEPTOR, APP_MIDDLEWARE } from '@nestjs/core';
import { CorrelationIdInterceptor } from '../interceptors/correlation-id.interceptor.tsx';
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
