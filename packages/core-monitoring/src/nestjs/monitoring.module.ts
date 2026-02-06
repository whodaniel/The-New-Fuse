/**
 * NestJS Monitoring Module
 * Provides monitoring integration for NestJS applications
 */

export interface MonitoringModuleOptions {
  sentry?: {
    enabled: boolean;
    dsn: string;
    environment: string;
    serviceName: string;
    release?: string;
    tracesSampleRate?: number;
  };
  logging?: {
    enabled: boolean;
    level: string;
    serviceName: string;
    file?: {
      enabled: boolean;
      dir: string;
    };
  };
  metrics?: {
    enabled: boolean;
    prefix?: string;
    defaultLabels?: Record<string, string>;
  };
  healthCheck?: {
    enabled: boolean;
    checkInterval?: number;
  };
  alerts?: {
    enabled: boolean;
    evaluationInterval?: number;
  };
}

/**
 * Monitoring module factory
 * Note: This is a type-safe template. Actual NestJS module would be implemented
 * in the service-specific packages that use @nestjs/common
 */
export class MonitoringModuleFactory {
  static forRoot(options: MonitoringModuleOptions) {
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
                level: options.logging.level as any,
                serviceName: options.logging.serviceName,
                environment: process.env.NODE_ENV as any,
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
