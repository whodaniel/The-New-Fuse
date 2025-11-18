# Monitoring & Observability Setup

## Overview

This document describes the comprehensive monitoring and observability setup for The New Fuse platform. The monitoring stack includes:

- **Error Tracking**: Sentry for error tracking and performance monitoring
- **Logging**: Winston for structured JSON logging
- **Metrics**: Prometheus for custom application metrics
- **Health Checks**: Comprehensive health check endpoints for all services
- **Alerting**: Alert manager with configurable rules and notification channels
- **Dashboards**: Grafana dashboards for visualization

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌───────────┐  ┌───────────┐  ┌────────────┐              │
│  │ API       │  │ Backend   │  │ Frontend   │              │
│  │ Gateway   │  │ Service   │  │ App        │              │
│  └─────┬─────┘  └─────┬─────┘  └──────┬─────┘              │
│        │              │                │                     │
└────────┼──────────────┼────────────────┼─────────────────────┘
         │              │                │
         └──────┬───────┴────────┬───────┘
                │                │
    ┌───────────▼────────────────▼──────────────┐
    │      Core Monitoring Package              │
    │  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
    │  │  Sentry  │  │  Winston │  │ Prom.   │ │
    │  │  Service │  │  Logger  │  │ Metrics │ │
    │  └──────────┘  └──────────┘  └─────────┘ │
    │  ┌──────────┐  ┌──────────┐              │
    │  │  Health  │  │  Alert   │              │
    │  │  Checks  │  │  Manager │              │
    │  └──────────┘  └──────────┘              │
    └───────┬───────────┬───────────┬───────────┘
            │           │           │
    ┌───────▼─────┐ ┌───▼────┐ ┌───▼─────────┐
    │   Sentry    │ │  Log   │ │ Prometheus  │
    │   Cloud     │ │  Files │ │   Server    │
    └─────────────┘ └────────┘ └──────┬──────┘
                                       │
                                ┌──────▼──────┐
                                │   Grafana   │
                                │  Dashboards │
                                └─────────────┘
```

## Installation

### 1. Install Core Monitoring Package

The core monitoring package is already included in the monorepo at `/packages/core-monitoring`.

### 2. Install Peer Dependencies

Each service needs to install the required peer dependencies:

```bash
# For API Gateway and Backend services
pnpm add @sentry/node winston winston-daily-rotate-file prom-client

# Optional: For disk space monitoring
pnpm add check-disk-space
```

### 3. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Sentry Configuration
SENTRY_DSN=your_sentry_dsn_here
SENTRY_RELEASE=1.0.0
NODE_ENV=production

# Logging Configuration
LOG_LEVEL=info
LOG_DIR=./logs

# Metrics Configuration
METRICS_ENABLED=true
METRICS_PREFIX=tnf

# Health Check Configuration
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# Alert Configuration
ALERTS_ENABLED=true
SLACK_WEBHOOK_URL=your_slack_webhook_url
PAGERDUTY_SERVICE_KEY=your_pagerduty_key
```

## Service Integration

### API Gateway Integration

Create `/apps/api-gateway/src/monitoring/monitoring.config.ts`:

```typescript
import { MonitoringModuleOptions } from '@tnf/core-monitoring';

export const monitoringConfig: MonitoringModuleOptions = {
  sentry: {
    enabled: process.env.NODE_ENV === 'production',
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    serviceName: 'api-gateway',
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0.1,
  },
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'info',
    serviceName: 'api-gateway',
    file: {
      enabled: process.env.NODE_ENV === 'production',
      dir: process.env.LOG_DIR || './logs',
    },
  },
  metrics: {
    enabled: process.env.METRICS_ENABLED === 'true',
    prefix: 'tnf_api_gateway',
    defaultLabels: {
      service: 'api-gateway',
      environment: process.env.NODE_ENV || 'development',
    },
  },
  healthCheck: {
    enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
    checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
  },
  alerts: {
    enabled: process.env.ALERTS_ENABLED === 'true',
    evaluationInterval: 60000,
  },
};
```

Create `/apps/api-gateway/src/monitoring/monitoring.module.ts`:

```typescript
import { Module, Global } from '@nestjs/common';
import { monitoringConfig } from './monitoring.config';
import {
  SentryService,
  WinstonLogger,
  PrometheusMetrics,
  HealthCheckService
} from '@tnf/core-monitoring';

@Global()
@Module({
  providers: [
    {
      provide: 'MONITORING_CONFIG',
      useValue: monitoringConfig,
    },
    {
      provide: SentryService,
      useFactory: async () => {
        if (monitoringConfig.sentry?.enabled) {
          const service = new SentryService();
          await service.initialize(monitoringConfig.sentry);
          return service;
        }
        return null;
      },
    },
    {
      provide: WinstonLogger,
      useFactory: async () => {
        if (monitoringConfig.logging?.enabled) {
          const logger = new WinstonLogger(monitoringConfig.logging as any);
          await logger.initialize();
          return logger;
        }
        return null;
      },
    },
    {
      provide: PrometheusMetrics,
      useFactory: async () => {
        if (monitoringConfig.metrics?.enabled) {
          const metrics = new PrometheusMetrics(monitoringConfig.metrics as any);
          await metrics.initialize();
          return metrics;
        }
        return null;
      },
    },
    {
      provide: HealthCheckService,
      useFactory: () => {
        if (monitoringConfig.healthCheck?.enabled) {
          return new HealthCheckService(monitoringConfig.healthCheck);
        }
        return null;
      },
    },
  ],
  exports: [SentryService, WinstonLogger, PrometheusMetrics, HealthCheckService],
})
export class MonitoringModule {}
```

Create health check controller `/apps/api-gateway/src/health/health.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, CommonHealthChecks } from '@tnf/core-monitoring';

@Controller('health')
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {
    // Register health checks
    this.setupHealthChecks();
  }

  private setupHealthChecks() {
    // Database health check
    // this.healthCheckService.register(
    //   'database',
    //   CommonHealthChecks.database(prismaClient)
    // );

    // Redis health check
    // this.healthCheckService.register(
    //   'redis',
    //   CommonHealthChecks.redis(redisClient)
    // );

    // Memory health check
    this.healthCheckService.register(
      'memory',
      CommonHealthChecks.memory(90)
    );
  }

  @Get('live')
  async liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async readiness() {
    const health = await this.healthCheckService.check();

    if (health.status === 'unhealthy') {
      throw new Error('Service is unhealthy');
    }

    return {
      status: health.status,
      timestamp: health.timestamp.toISOString(),
      uptime: health.uptime,
      version: health.version,
      services: health.services,
    };
  }

  @Get()
  async health() {
    return this.readiness();
  }
}
```

Create metrics controller `/apps/api-gateway/src/metrics/metrics.controller.ts`:

```typescript
import { Controller, Get, Header } from '@nestjs/common';
import { PrometheusMetrics } from '@tnf/core-monitoring';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: PrometheusMetrics) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async metrics() {
    return this.metricsService.getMetrics();
  }
}
```

Create monitoring interceptor `/apps/api-gateway/src/monitoring/monitoring.interceptor.ts`:

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

    // Add request ID
    request.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add breadcrumb
    this.sentry?.addBreadcrumb({
      message: `HTTP ${request.method} ${request.url}`,
      category: 'http',
      level: 'info',
      data: {
        method: request.method,
        url: request.url,
        requestId: request.id,
      },
    });

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;

        // Log request
        this.logger?.logRequest(request, response, duration);

        // Record metrics
        this.metrics?.recordHttpRequest(
          request.method,
          request.route?.path || request.url,
          response.statusCode,
          duration
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        // Log error
        this.logger?.error(`HTTP ${request.method} ${request.url} failed`, error, {
          method: request.method,
          url: request.url,
          statusCode: response.statusCode,
          duration,
          requestId: request.id,
        });

        // Record error metrics
        this.metrics?.recordHttpRequest(
          request.method,
          request.route?.path || request.url,
          response.statusCode || 500,
          duration
        );

        // Capture exception
        this.sentry?.captureException(error, {
          tags: {
            method: request.method,
            route: request.route?.path || request.url,
            statusCode: response.statusCode?.toString() || '500',
          },
          extra: {
            requestId: request.id,
            userId: request.user?.id,
            duration,
          },
        });

        throw error;
      })
    );
  }
}
```

Update `/apps/api-gateway/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MonitoringInterceptor } from './monitoring/monitoring.interceptor';
import { WinstonLogger, PrometheusMetrics, SentryService } from '@tnf/core-monitoring';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get monitoring services
  const logger = app.get(WinstonLogger, { strict: false });
  const metrics = app.get(PrometheusMetrics, { strict: false });
  const sentry = app.get(SentryService, { strict: false });

  // Apply global interceptor
  app.useGlobalInterceptors(
    new MonitoringInterceptor(logger, metrics, sentry)
  );

  // Enable shutdown hooks
  app.enableShutdownHooks();

  await app.listen(3001);

  if (logger) {
    logger.info('API Gateway started', { port: 3001 });
  }
}

bootstrap().catch((error) => {
  console.error('Failed to start API Gateway:', error);
  process.exit(1);
});
```

Update `/apps/api-gateway/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MonitoringModule } from './monitoring/monitoring.module';
import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';

@Module({
  imports: [
    MonitoringModule,
    // ... other modules
  ],
  controllers: [
    HealthController,
    MetricsController,
    // ... other controllers
  ],
})
export class AppModule {}
```

### Backend Service Integration

Follow the same pattern as API Gateway integration. The configuration would be similar but with `serviceName: 'backend-service'`.

### Frontend Integration

For frontend (React) applications, use `@sentry/react`:

```bash
pnpm add @sentry/react
```

Create `/apps/frontend/src/monitoring/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react';

export function initSentry() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay(),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event, hint) {
        // Filter sensitive data
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
    });
  }
}
```

Update `/apps/frontend/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import { initSentry } from './monitoring/sentry';

// Initialize Sentry
initSentry();

const SentryApp = Sentry.withProfiler(App);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div>An error occurred</div>}>
      <SentryApp />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
```

## Health Check Endpoints

All services expose the following health check endpoints:

- `GET /health/live` - Liveness probe (returns 200 if service is running)
- `GET /health/ready` - Readiness probe (returns 200 if service is ready to serve traffic)
- `GET /health` - Detailed health information
- `GET /health/startup` - Startup probe (returns 200 when initialization is complete)

### Example Response

```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "uptime": 3600000,
  "version": "1.0.0",
  "services": {
    "database": {
      "name": "database",
      "status": "healthy",
      "timestamp": "2025-11-18T10:30:00.000Z",
      "responseTime": 15,
      "message": "Database connection is healthy"
    },
    "redis": {
      "name": "redis",
      "status": "healthy",
      "timestamp": "2025-11-18T10:30:00.000Z",
      "responseTime": 5,
      "message": "Redis connection is healthy"
    },
    "memory": {
      "name": "memory",
      "status": "healthy",
      "timestamp": "2025-11-18T10:30:00.000Z",
      "responseTime": 1,
      "message": "Memory usage: 45.32%",
      "details": {
        "heapUsed": 123456789,
        "heapTotal": 272629760,
        "heapUsedPercent": 45.32
      }
    }
  },
  "metrics": {
    "totalChecks": 3,
    "healthyChecks": 3,
    "degradedChecks": 0,
    "unhealthyChecks": 0,
    "averageResponseTime": 7
  }
}
```

## Metrics Endpoints

All services expose metrics at:

- `GET /metrics` - Prometheus metrics in text format

### Available Metrics

#### HTTP Metrics
- `tnf_http_request_duration_ms` - HTTP request duration histogram
- `tnf_http_requests_total` - Total HTTP requests counter
- `tnf_http_request_errors_total` - HTTP request errors counter
- `tnf_active_connections` - Active connections gauge

#### Database Metrics
- `tnf_database_query_duration_ms` - Database query duration histogram
- `tnf_database_connection_pool` - Connection pool metrics gauge

#### Cache Metrics
- `tnf_cache_hits_total` - Cache hits counter
- `tnf_cache_misses_total` - Cache misses counter

#### Application Metrics
- `tnf_agents_total` - Total agents gauge
- `tnf_workflow_executions_total` - Workflow executions counter
- `tnf_websocket_connections` - WebSocket connections gauge
- `tnf_job_queue_size` - Job queue size gauge
- `tnf_job_processing_duration_ms` - Job processing duration histogram

#### System Metrics (default)
- `process_cpu_seconds_total` - CPU time
- `process_resident_memory_bytes` - Memory usage
- `nodejs_heap_size_total_bytes` - Heap size
- `nodejs_heap_size_used_bytes` - Used heap
- `nodejs_eventloop_lag_seconds` - Event loop lag

## Logging

All services use Winston for structured JSON logging.

### Log Levels

- `error` - Error events that might still allow the application to continue running
- `warn` - Warning events that might lead to errors
- `info` - Informational messages about application progress
- `http` - HTTP request logs
- `debug` - Detailed information for debugging

### Log Format

```json
{
  "timestamp": "2025-11-18T10:30:00.000Z",
  "level": "info",
  "service": "api-gateway",
  "message": "GET /api/users",
  "method": "GET",
  "url": "/api/users",
  "statusCode": 200,
  "duration": 45,
  "requestId": "req_1234567890_abc123",
  "userId": "user_123",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.1"
  }
}
```

### Log Files

Logs are stored in the configured `LOG_DIR` (default: `./logs`):

- `YYYY-MM-DD-app.log` - All logs
- `YYYY-MM-DD-error.log` - Error logs only

Logs are rotated daily and kept for 14 days by default.

## Alert Rules

Alert rules are configured in `/packages/core-monitoring/src/config/alert-rules.json`.

### Available Alert Rules

1. **High Error Rate** - Triggers when error rate > 5%
2. **Slow Response Time** - Triggers when P95 response time > 2s
3. **High Memory Usage** - Triggers when memory usage > 90%
4. **High CPU Usage** - Triggers when CPU usage > 80%
5. **Database Connection Pool Exhausted** - Triggers when pool utilization > 90%
6. **Slow Database Queries** - Triggers when P95 query time > 5s
7. **WebSocket Connection Surge** - Triggers when connections increase > 50%
8. **High Failed Job Rate** - Triggers when job failure rate > 10%
9. **Service Down** - Triggers when service doesn't respond to health checks

### Alert Severity Levels

- `info` - Informational alerts
- `warning` - Warning alerts that should be investigated
- `error` - Error alerts that require attention
- `critical` - Critical alerts that require immediate action

### Notification Channels

Alerts can be sent to:

- **Slack** - Webhook integration
- **Email** - SMTP integration
- **PagerDuty** - PagerDuty API integration
- **Webhook** - Custom webhook integration

## Dashboards

Grafana dashboards are available in `/packages/core-monitoring/src/dashboards/grafana-dashboards.json`.

### Available Dashboards

1. **Service Health Overview** - Overall health of all services
2. **Agent Activity Dashboard** - Agent creation and activity
3. **Database Performance** - Database queries and connection pool
4. **API Performance Metrics** - API response times and error rates
5. **System Resource Usage** - CPU, memory, and connections

### Importing Dashboards

1. Open Grafana
2. Go to Dashboards > Import
3. Upload the JSON file
4. Select your Prometheus data source
5. Click Import

## Deployment

### Kubernetes Integration

Health check endpoints are compatible with Kubernetes probes:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-gateway
spec:
  containers:
  - name: api-gateway
    image: your-registry/api-gateway:latest
    ports:
    - containerPort: 3001
    livenessProbe:
      httpGet:
        path: /health/live
        port: 3001
      initialDelaySeconds: 10
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 3001
      initialDelaySeconds: 5
      periodSeconds: 5
    startupProbe:
      httpGet:
        path: /health/startup
        port: 3001
      failureThreshold: 30
      periodSeconds: 10
```

### Prometheus Configuration

Add the following to your Prometheus `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'backend-service'
    static_configs:
      - targets: ['backend-service:3004']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

## Troubleshooting

### Sentry Not Capturing Errors

1. Check that `SENTRY_DSN` is set correctly
2. Verify that the service name matches in the configuration
3. Check that source maps are uploaded for proper stack traces
4. Verify that `beforeSend` filter is not blocking events

### Metrics Not Appearing

1. Check that `/metrics` endpoint is accessible
2. Verify Prometheus is scraping the endpoint
3. Check for metric naming conflicts
4. Verify that metrics are being recorded in the code

### Health Checks Failing

1. Check that health check dependencies (database, Redis) are accessible
2. Verify timeout settings are appropriate
3. Check health check logs for specific errors
4. Verify that health check service is registered correctly

### Logs Not Being Written

1. Check that `LOG_DIR` exists and is writable
2. Verify winston is installed
3. Check log level configuration
4. Verify file transport is enabled in production

## Best Practices

1. **Always use structured logging** - Include metadata with all log entries
2. **Set appropriate log levels** - Use debug in development, info in production
3. **Monitor your monitors** - Set up alerts for monitoring failures
4. **Regular dashboard reviews** - Review dashboards weekly to identify trends
5. **Keep alert rules updated** - Adjust thresholds based on actual metrics
6. **Test health checks** - Regularly test health check endpoints
7. **Rotate logs** - Configure log rotation to prevent disk space issues
8. **Use correlation IDs** - Track requests across services with correlation IDs
9. **Monitor error rates** - Set up alerts for unusual error rate spikes
10. **Document runbooks** - Create runbooks for each alert rule

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [NestJS Health Checks](https://docs.nestjs.com/recipes/terminus)
