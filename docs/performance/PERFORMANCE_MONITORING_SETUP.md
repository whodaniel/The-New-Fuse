# Performance Monitoring Setup Guide

Complete guide for setting up comprehensive performance monitoring across your application stack.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Frontend Monitoring](#frontend-monitoring)
3. [Backend Monitoring](#backend-monitoring)
4. [Database Monitoring](#database-monitoring)
5. [Infrastructure Monitoring](#infrastructure-monitoring)
6. [Dashboard Setup](#dashboard-setup)
7. [Integration Examples](#integration-examples)

## Quick Start

### Installation

```bash
# Install monitoring package
pnpm add @tnf/core-monitoring

# Install peer dependencies
pnpm add web-vitals @sentry/node winston prom-client
```

### Environment Variables

Create or update `.env.local`:

```bash
# Sentry (Error Tracking & Performance)
SENTRY_DSN=your_sentry_dsn
SENTRY_RELEASE=1.0.0
SENTRY_ENVIRONMENT=production

# APM Configuration
APM_ENABLED=true
APM_SAMPLE_RATE=1.0
APM_SLOW_QUERY_THRESHOLD=100
APM_SLOW_REQUEST_THRESHOLD=1000

# Database Monitoring
DB_MONITORING_ENABLED=true
DB_SLOW_QUERY_THRESHOLD=100
DB_CAPTURE_STACK_TRACE=true
DB_SAMPLE_RATE=1.0

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Metrics
METRICS_ENABLED=true
METRICS_PREFIX=tnf
```

## Frontend Monitoring

### 1. Web Vitals Setup

Add Web Vitals tracking to your frontend application:

```typescript
// apps/frontend/src/lib/monitoring.ts
import { createWebVitalsMonitor } from '@tnf/core-monitoring';

export async function initializeMonitoring() {
  // Initialize Web Vitals monitoring
  const vitalsMonitor = await createWebVitalsMonitor({
    enabled: import.meta.env.PROD,
    reportUrl: '/api/analytics/vitals',
    sampleRate: 0.1, // Sample 10% in production
    reportAllChanges: false,
    onReport: (report) => {
      // Custom handling
      console.log('Web Vitals Report:', report);

      // Send to analytics service
      if (window.gtag) {
        for (const vital of report.vitals) {
          window.gtag('event', vital.name, {
            value: Math.round(vital.value),
            metric_id: vital.id,
            metric_rating: vital.rating,
          });
        }
      }
    },
  });

  // Track custom metrics
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    vitalsMonitor.trackCustomMetric('app-load-time', loadTime);
  });

  return vitalsMonitor;
}
```

### 2. Initialize in Main Entry

```typescript
// apps/frontend/src/main.tsx
import { initializeMonitoring } from './lib/monitoring';

async function bootstrap() {
  // Initialize monitoring first
  await initializeMonitoring();

  // Then render app
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
}

bootstrap();
```

### 3. Add Reporting Endpoint

Create an API endpoint to receive Web Vitals reports:

```typescript
// apps/api/src/analytics/analytics.controller.ts
import { Controller, Post, Body } from '@nestjs/common';

@Controller('analytics')
export class AnalyticsController {
  @Post('vitals')
  async recordVitals(@Body() report: any) {
    // Store in database or analytics service
    console.log('Web Vitals Report:', {
      url: report.url,
      sessionId: report.sessionId,
      vitals: report.vitals.map(v => ({
        name: v.name,
        value: v.value,
        rating: v.rating,
      })),
    });

    return { success: true };
  }
}
```

## Backend Monitoring

### 1. APM Setup

Initialize APM in your NestJS application:

```typescript
// apps/api/src/monitoring/monitoring.module.ts
import { Module, Global } from '@nestjs/common';
import { createAPMFromEnv, APMService } from '@tnf/core-monitoring';

@Global()
@Module({
  providers: [
    {
      provide: APMService,
      useFactory: async () => {
        const apm = createAPMFromEnv();
        await apm.initialize();
        return apm;
      },
    },
  ],
  exports: [APMService],
})
export class MonitoringModule {}
```

### 2. APM Interceptor

Create an interceptor to automatically track all HTTP requests:

```typescript
// apps/api/src/monitoring/apm.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { APMService } from '@tnf/core-monitoring';

@Injectable()
export class APMInterceptor implements NestInterceptor {
  constructor(private readonly apm: APMService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Start transaction
    const transaction = this.apm.startTransaction(
      `${request.method} ${request.route?.path || request.url}`,
      'request'
    );

    // Set context
    this.apm.setTransactionContext(transaction.id, {
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
      },
      user: request.user
        ? {
            id: request.user.id,
            email: request.user.email,
          }
        : undefined,
    });

    // Store transaction ID in request for spans
    request.transactionId = transaction.id;

    return next.handle().pipe(
      tap(() => {
        this.apm.setTransactionContext(transaction.id, {
          response: {
            statusCode: response.statusCode,
          },
        });
        this.apm.endTransaction(transaction.id, 'success');
      }),
      catchError((error) => {
        this.apm.endTransaction(transaction.id, 'error');
        throw error;
      })
    );
  }
}
```

### 3. Register Interceptor Globally

```typescript
// apps/api/src/app.module.ts
import { APP_INTERCEPTOR } from '@nestjs/core';
import { APMInterceptor } from './monitoring/apm.interceptor';

@Module({
  imports: [MonitoringModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: APMInterceptor,
    },
  ],
})
export class AppModule {}
```

## Database Monitoring

### 1. Database Monitor Setup

Initialize database monitoring:

```typescript
// apps/api/src/monitoring/database-monitoring.module.ts
import { Module, Global } from '@nestjs/common';
import { createDatabaseMonitorFromEnv, DatabaseMonitor } from '@tnf/core-monitoring';

@Global()
@Module({
  providers: [
    {
      provide: DatabaseMonitor,
      useFactory: async () => {
        const monitor = createDatabaseMonitorFromEnv();
        await monitor.initialize();
        return monitor;
      },
    },
  ],
  exports: [DatabaseMonitor],
})
export class DatabaseMonitoringModule {}
```

### 2. Prisma Middleware

Add Prisma middleware to track all queries:

```typescript
// apps/api/src/database/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DatabaseMonitor } from '@tnf/core-monitoring';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private dbMonitor: DatabaseMonitor) {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    // Add monitoring middleware
    this.$use(async (params, next) => {
      const startTime = Date.now();

      try {
        const result = await next(params);
        const duration = Date.now() - startTime;

        // Track query
        this.dbMonitor.trackQuery(
          'postgres',
          `${params.action} ${params.model}`,
          duration,
          {
            operation: this.mapAction(params.action),
            table: params.model,
            success: true,
          }
        );

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        this.dbMonitor.trackQuery(
          'postgres',
          `${params.action} ${params.model}`,
          duration,
          {
            operation: this.mapAction(params.action),
            table: params.model,
            success: false,
            error: error.message,
          }
        );

        throw error;
      }
    });

    // Track connection pool metrics periodically
    setInterval(() => {
      this.trackPoolMetrics();
    }, 30000); // Every 30 seconds
  }

  private mapAction(action: string): any {
    const actionMap: Record<string, any> = {
      findUnique: 'SELECT',
      findFirst: 'SELECT',
      findMany: 'SELECT',
      create: 'INSERT',
      createMany: 'INSERT',
      update: 'UPDATE',
      updateMany: 'UPDATE',
      delete: 'DELETE',
      deleteMany: 'DELETE',
    };

    return actionMap[action] || 'OTHER';
  }

  private async trackPoolMetrics() {
    // Get pool stats from Prisma
    const poolMetrics = {
      total: 10, // From your Prisma config
      active: 0, // Would need custom tracking
      idle: 0,
      waiting: 0,
    };

    this.dbMonitor.recordPoolMetrics('postgres', poolMetrics);
  }
}
```

### 3. Manual Query Tracking

For complex queries or raw SQL:

```typescript
import { DatabaseMonitor } from '@tnf/core-monitoring';

@Injectable()
export class UsersService {
  constructor(
    private db: PrismaService,
    private dbMonitor: DatabaseMonitor
  ) {}

  async complexQuery() {
    return this.dbMonitor.trackQueryExecution(
      'postgres',
      'SELECT u.*, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id',
      async () => {
        return this.db.$queryRaw`
          SELECT u.*, COUNT(o.id) as order_count
          FROM users u
          LEFT JOIN orders o ON u.id = o.user_id
          GROUP BY u.id
        `;
      },
      {
        operation: 'SELECT',
        table: 'users',
      }
    );
  }
}
```

## Infrastructure Monitoring

### 1. System Metrics

Track system-level metrics:

```typescript
// apps/api/src/monitoring/system-metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { performanceDashboard } from '@tnf/core-monitoring';
import * as os from 'os';

@Injectable()
export class SystemMetricsService {
  @Cron('*/30 * * * * *') // Every 30 seconds
  collectMetrics() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Calculate CPU usage
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    // Update dashboard with infrastructure metrics
    const metrics = performanceDashboard.getCurrentMetrics();
    if (metrics) {
      metrics.infrastructure = {
        cpu: {
          usage: cpuUsage,
          cores: cpus.length,
        },
        memory: {
          used: usedMem,
          total: totalMem,
          utilization: (usedMem / totalMem) * 100,
        },
        disk: {
          // Would need disk monitoring library
          used: 0,
          total: 0,
          utilization: 0,
        },
      };

      performanceDashboard.addMetrics(metrics);
    }
  }
}
```

## Dashboard Setup

### 1. Performance Dashboard Controller

Create an API endpoint to access dashboard data:

```typescript
// apps/api/src/monitoring/dashboard.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { performanceDashboard } from '@tnf/core-monitoring';

@Controller('monitoring/dashboard')
export class DashboardController {
  @Get('current')
  getCurrentMetrics() {
    return performanceDashboard.getCurrentMetrics();
  }

  @Get('summary')
  getSummary() {
    return performanceDashboard.getSummary();
  }

  @Get('alerts')
  getAlerts(@Query('severity') severity?: string) {
    return performanceDashboard.getAlerts(severity as any);
  }

  @Get('timeseries')
  getTimeSeries(
    @Query('category') category: string,
    @Query('metric') metric: string,
    @Query('duration') duration?: string
  ) {
    const durationMs = duration ? parseInt(duration) : 3600000;
    return performanceDashboard.getTimeSeries(
      category as any,
      metric,
      durationMs
    );
  }

  @Get('history')
  getHistory(@Query('duration') duration?: string) {
    const durationMs = duration ? parseInt(duration) : 3600000;
    return performanceDashboard.getMetricsHistory(durationMs);
  }
}
```

### 2. Frontend Dashboard

Create a React component to display dashboard:

```typescript
// apps/frontend/src/components/PerformanceDashboard.tsx
import { useEffect, useState } from 'react';

interface DashboardSummary {
  overall: 'good' | 'degraded' | 'poor';
  frontend: 'good' | 'degraded' | 'poor';
  backend: 'good' | 'degraded' | 'poor';
  database: 'good' | 'degraded' | 'poor';
  criticalAlerts: number;
  warningAlerts: number;
}

export function PerformanceDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await fetch('/api/monitoring/dashboard/summary');
      const data = await response.json();
      setSummary(data);
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, []);

  if (!summary) return <div>Loading...</div>;

  return (
    <div className="performance-dashboard">
      <h1>Performance Dashboard</h1>

      <div className="health-summary">
        <HealthIndicator label="Overall" status={summary.overall} />
        <HealthIndicator label="Frontend" status={summary.frontend} />
        <HealthIndicator label="Backend" status={summary.backend} />
        <HealthIndicator label="Database" status={summary.database} />
      </div>

      <div className="alerts">
        <Alert severity="critical" count={summary.criticalAlerts} />
        <Alert severity="warning" count={summary.warningAlerts} />
      </div>
    </div>
  );
}

function HealthIndicator({ label, status }: { label: string; status: string }) {
  const colors = {
    good: 'green',
    degraded: 'yellow',
    poor: 'red',
  };

  return (
    <div className={`health-indicator ${status}`}>
      <span className="label">{label}</span>
      <span className="status" style={{ color: colors[status] }}>
        {status}
      </span>
    </div>
  );
}
```

## Integration Examples

### Complete Frontend Integration

```typescript
// apps/frontend/src/lib/monitoring.ts
import { createWebVitalsMonitor } from '@tnf/core-monitoring';

export async function setupMonitoring() {
  if (!import.meta.env.PROD) {
    return;
  }

  // Web Vitals
  const vitalsMonitor = await createWebVitalsMonitor({
    enabled: true,
    reportUrl: '/api/analytics/vitals',
    sampleRate: 0.1,
    onReport: async (report) => {
      // Send to backend
      await fetch('/api/analytics/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
    },
  });

  // Track route changes
  window.addEventListener('popstate', () => {
    vitalsMonitor.trackCustomMetric('route-change', performance.now());
  });

  // Track errors
  window.addEventListener('error', (event) => {
    console.error('Frontend error:', event.error);
  });

  return vitalsMonitor;
}
```

### Complete Backend Integration

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Start listening
  await app.listen(process.env.PORT || 8080);

  console.log('✓ Monitoring enabled');
  console.log('✓ APM tracking HTTP requests');
  console.log('✓ Database query monitoring active');
}

bootstrap();
```

## Verification

After setup, verify monitoring is working:

```bash
# Check Web Vitals reporting
curl -X POST http://localhost:8080/api/analytics/vitals \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check dashboard endpoint
curl http://localhost:8080/api/monitoring/dashboard/summary

# Check slow queries
curl http://localhost:8080/api/monitoring/database/slow-queries

# View metrics
curl http://localhost:8080/metrics
```

## Troubleshooting

### Web Vitals not reporting

1. Check browser console for errors
2. Verify `/api/analytics/vitals` endpoint is accessible
3. Check network tab for failed requests
4. Verify sample rate is not too low

### APM not tracking requests

1. Check APM interceptor is registered globally
2. Verify environment variables are set
3. Check logs for initialization errors
4. Ensure `APM_ENABLED=true`

### Database monitoring not working

1. Verify Prisma middleware is registered
2. Check `DB_MONITORING_ENABLED=true`
3. Review logs for tracking errors
4. Test with manual query tracking

## Next Steps

1. [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION.md)
2. [Alert Configuration](../monitoring/ALERT_RUNBOOKS.md)
3. [Dashboard Customization](./DASHBOARD_CUSTOMIZATION.md)
