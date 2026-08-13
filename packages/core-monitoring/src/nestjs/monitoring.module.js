'use strict';
/**
 * NestJS Monitoring Module
 * Provides monitoring integration for NestJS applications
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.MonitoringModuleFactory = void 0;
/**
 * Monitoring module factory
 * Note: This is a type-safe template. Actual NestJS module would be implemented
 * in the service-specific packages that use @nestjs/common
 */
class MonitoringModuleFactory {
  static forRoot(options) {
    return {
      module: 'MonitoringModule',
      providers: [
        {
          provide: 'MONITORING_OPTIONS',
          useValue: options,
        },
        {
          provide: 'SentryService',
          useFactory: async () => {
            if (options.sentry?.enabled) {
              const { SentryService } = await import('../sentry/sentry-integrations');
              const { getSentryConfigFromEnv, beforeSendFilter } =
                await import('../sentry/sentry-config');
              const service = new SentryService();
              const config = {
                ...getSentryConfigFromEnv(options.sentry.serviceName),
                ...options.sentry,
                beforeSend: beforeSendFilter,
              };
              await service.initialize(config);
              return service;
            }
            return null;
          },
        },
        {
          provide: 'LoggingService',
          useFactory: async () => {
            if (options.logging?.enabled) {
              const { WinstonLogger } = await import('../logging/winston-logger');
              const logger = new WinstonLogger({
                level: options.logging.level,
                serviceName: options.logging.serviceName,
                environment: process.env.NODE_ENV,
                console: {
                  enabled: true,
                  colorize: process.env.NODE_ENV === 'development',
                },
                file: options.logging.file,
              });
              await logger.initialize();
              return logger;
            }
            return null;
          },
        },
        {
          provide: 'MetricsService',
          useFactory: async () => {
            if (options.metrics?.enabled) {
              const { PrometheusMetrics } = await import('../metrics/prometheus-metrics');
              const metrics = new PrometheusMetrics({
                enabled: true,
                prefix: options.metrics.prefix,
                defaultLabels: options.metrics.defaultLabels,
              });
              await metrics.initialize();
              return metrics;
            }
            return null;
          },
        },
        {
          provide: 'HealthCheckService',
          useFactory: async () => {
            if (options.healthCheck?.enabled) {
              const { HealthCheckService } = await import('../health/health-check');
              return new HealthCheckService({
                checkInterval: options.healthCheck.checkInterval,
              });
            }
            return null;
          },
        },
      ],
      exports: ['SentryService', 'LoggingService', 'MetricsService', 'HealthCheckService'],
    };
  }
}
exports.MonitoringModuleFactory = MonitoringModuleFactory;
//# sourceMappingURL=monitoring.module.js.map
