# @tnf/core-monitoring

Comprehensive monitoring and observability package for The New Fuse platform.

## Features

- **Error Tracking**: Sentry integration for error tracking and performance monitoring
- **Structured Logging**: Winston-based JSON logging with multiple transports
- **Metrics Collection**: Prometheus metrics for application and business metrics
- **Health Checks**: Comprehensive health check system with dependency monitoring
- **Alert Management**: Configurable alert rules with multiple notification channels
- **NestJS Integration**: Ready-to-use modules, interceptors, and controllers for NestJS

## Installation

```bash
pnpm add @tnf/core-monitoring
```

### Peer Dependencies

Install the peer dependencies you need:

```bash
# For error tracking
pnpm add @sentry/node

# For logging
pnpm add winston winston-daily-rotate-file

# For metrics
pnpm add prom-client

# Optional: for disk space monitoring
pnpm add check-disk-space
```

## Quick Start

### 1. Initialize Sentry

```typescript
import { SentryService, getSentryConfigFromEnv } from '@tnf/core-monitoring';

const sentryService = new SentryService();
await sentryService.initialize(getSentryConfigFromEnv('my-service'));

// Capture an error
sentryService.captureException(new Error('Something went wrong'), {
  user: { id: 'user_123' },
  tags: { feature: 'auth' },
  level: 'error',
});
```

### 2. Setup Logging

```typescript
import { WinstonLogger } from '@tnf/core-monitoring';

const logger = new WinstonLogger({
  level: 'info',
  serviceName: 'my-service',
  environment: 'production',
  console: {
    enabled: true,
    colorize: false,
  },
  file: {
    enabled: true,
    dir: './logs',
  },
});

await logger.initialize();

logger.info('Application started', { port: 3000 });
logger.error('Failed to connect to database', error, { retry: 3 });
```

### 3. Collect Metrics

```typescript
import { PrometheusMetrics } from '@tnf/core-monitoring';

const metrics = new PrometheusMetrics({
  enabled: true,
  prefix: 'my_service',
  defaultLabels: {
    service: 'my-service',
    environment: 'production',
  },
});

await metrics.initialize();

// Record HTTP request
metrics.recordHttpRequest('GET', '/api/users', 200, 45);

// Record database query
metrics.recordDatabaseQuery('SELECT', 'users', 15, true);

// Set custom gauge
metrics.agentCount.set({ status: 'active', type: 'ai' }, 150);

// Get metrics for Prometheus
const metricsText = await metrics.getMetrics();
```

### 4. Setup Health Checks

```typescript
import { HealthCheckService, CommonHealthChecks } from '@tnf/core-monitoring';

const healthCheckService = new HealthCheckService({
  checkInterval: 30000,
  timeout: 5000,
});

// Register database health check
healthCheckService.register(
  'database',
  CommonHealthChecks.database(prismaClient)
);

// Register Redis health check
healthCheckService.register(
  'redis',
  CommonHealthChecks.redis(redisClient)
);

// Register memory health check
healthCheckService.register(
  'memory',
  CommonHealthChecks.memory(90)
);

// Start periodic checks
healthCheckService.startPeriodicChecks();

// Get current health status
const health = await healthCheckService.check();
console.log(health);
```

### 5. Configure Alerts

```typescript
import { AlertManager, defaultAlertRules } from '@tnf/core-monitoring';

const alertManager = new AlertManager({
  evaluationInterval: 60000,
  notificationCooldown: 300000,
  autoResolveAfter: 3600000,
  enabled: true,
});

// Add default rules
defaultAlertRules.forEach(rule => alertManager.addRule(rule));

// Set metrics provider
alertManager.setMetricsProvider(async () => ({
  http_error_rate: 3.5,
  http_response_time_avg: 1800,
  memory_usage_percent: 75,
  // ... other metrics
}));

// Start evaluation
alertManager.start();

// Listen for alerts
alertManager.on('alertFired', (alert) => {
  console.log('Alert fired:', alert);
});
```

## NestJS Integration

### 1. Create Monitoring Module

```typescript
import { Module, Global } from '@nestjs/common';
import {
  SentryService,
  WinstonLogger,
  PrometheusMetrics,
  HealthCheckService,
} from '@tnf/core-monitoring';

@Global()
@Module({
  providers: [
    {
      provide: SentryService,
      useFactory: async () => {
        const service = new SentryService();
        await service.initialize({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV,
          serviceName: 'my-service',
        });
        return service;
      },
    },
    {
      provide: WinstonLogger,
      useFactory: async () => {
        const logger = new WinstonLogger({
          level: 'info',
          serviceName: 'my-service',
          environment: process.env.NODE_ENV as any,
          console: { enabled: true },
          file: { enabled: true, dir: './logs' },
        });
        await logger.initialize();
        return logger;
      },
    },
    {
      provide: PrometheusMetrics,
      useFactory: async () => {
        const metrics = new PrometheusMetrics({
          enabled: true,
          prefix: 'my_service',
        });
        await metrics.initialize();
        return metrics;
      },
    },
    {
      provide: HealthCheckService,
      useFactory: () => new HealthCheckService(),
    },
  ],
  exports: [SentryService, WinstonLogger, PrometheusMetrics, HealthCheckService],
})
export class MonitoringModule {}
```

### 2. Add Monitoring Interceptor

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { WinstonLogger, PrometheusMetrics, SentryService } from '@tnf/core-monitoring';

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: WinstonLogger,
    private readonly metrics: PrometheusMetrics,
    private readonly sentry: SentryService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.logRequest(request, response, duration);
        this.metrics.recordHttpRequest(
          request.method,
          request.route?.path,
          response.statusCode,
          duration
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error('Request failed', error);
        this.sentry.captureException(error);
        throw error;
      })
    );
  }
}
```

### 3. Add Health Check Controller

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from '@tnf/core-monitoring';

@Controller('health')
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get('live')
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  async readiness() {
    const health = await this.healthCheckService.check();
    if (health.status === 'unhealthy') {
      throw new Error('Service unhealthy');
    }
    return health;
  }
}
```

### 4. Add Metrics Controller

```typescript
import { Controller, Get, Header } from '@nestjs/common';
import { PrometheusMetrics } from '@tnf/core-monitoring';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: PrometheusMetrics) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics() {
    return this.metrics.getMetrics();
  }
}
```

## API Reference

### SentryService

```typescript
class SentryService {
  initialize(config: SentryConfig): Promise<void>
  captureException(error: Error, context?: ErrorContext): string | undefined
  captureMessage(message: string, level?: string, context?: ErrorContext): string | undefined
  addBreadcrumb(breadcrumb: object): void
  setUser(user: object | null): void
  setTag(key: string, value: string): void
  flush(timeout?: number): Promise<boolean>
  close(timeout?: number): Promise<boolean>
}
```

### WinstonLogger

```typescript
class WinstonLogger {
  initialize(): Promise<void>
  error(message: string, error?: Error, metadata?: object): void
  warn(message: string, metadata?: object): void
  info(message: string, metadata?: object): void
  http(message: string, metadata?: object): void
  debug(message: string, metadata?: object): void
  logRequest(req: any, res: any, duration: number): void
  logSlowQuery(query: string, duration: number, threshold?: number): void
  child(metadata: object): WinstonLogger
}
```

### PrometheusMetrics

```typescript
class PrometheusMetrics {
  initialize(): Promise<void>
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void
  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void
  setDatabaseConnectionPool(database: string, idle: number, active: number, total: number): void
  recordCacheHit(cacheType: string, keyPattern: string): void
  recordCacheMiss(cacheType: string, keyPattern: string): void
  setAgentCount(active: number, inactive: number, type?: string): void
  recordWorkflowExecution(workflowType: string, success: boolean): void
  getMetrics(): Promise<string>
  createMetric(metric: CustomMetric): any
}
```

### HealthCheckService

```typescript
class HealthCheckService {
  register(name: string, check: HealthCheckFunction): void
  unregister(name: string): void
  check(): Promise<SystemHealthStatus>
  startPeriodicChecks(): void
  stopPeriodicChecks(): void
  getStatus(): SystemHealthStatus | null
}
```

### AlertManager

```typescript
class AlertManager {
  setMetricsProvider(provider: () => Promise<Record<string, number>>): void
  addRule(rule: AlertRule): void
  removeRule(ruleId: string): void
  updateRule(ruleId: string, updates: Partial<AlertRule>): void
  getRules(): AlertRule[]
  getActiveAlerts(): Alert[]
  getAlertHistory(limit?: number): Alert[]
  start(): void
  stop(): void
  triggerAlert(ruleId: string, value: number, metadata?: object): void
}
```

## Configuration

### Environment Variables

```bash
# Sentry
SENTRY_DSN=your_sentry_dsn
SENTRY_RELEASE=1.0.0

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Metrics
METRICS_ENABLED=true
METRICS_PREFIX=my_service

# Health Checks
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# Alerts
ALERTS_ENABLED=true
SLACK_WEBHOOK_URL=your_slack_webhook
```

## Examples

See the [examples](../../docs/monitoring/MONITORING_SETUP.md) directory for complete integration examples.

## Documentation

- [Monitoring Setup Guide](../../docs/monitoring/MONITORING_SETUP.md)
- [Alert Runbooks](../../docs/monitoring/ALERT_RUNBOOKS.md)
- [Incident Response](../../docs/monitoring/INCIDENT_RESPONSE.md)

## License

Private - The New Fuse
