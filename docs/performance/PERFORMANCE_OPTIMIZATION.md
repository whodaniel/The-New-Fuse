# Performance Optimization Guide

Complete guide for optimizing performance across the entire stack.

## Table of Contents

1. [Overview](#overview)
2. [Frontend Performance](#frontend-performance)
3. [Backend Performance](#backend-performance)
4. [Database Performance](#database-performance)
5. [Monitoring & Metrics](#monitoring--metrics)
6. [Performance Budgets](#performance-budgets)
7. [Optimization Workflow](#optimization-workflow)
8. [Tools & Scripts](#tools--scripts)

## Overview

Performance optimization is a continuous process that requires monitoring, measurement, and iteration. This guide provides comprehensive workflows for identifying and resolving performance issues.

### Performance Goals

- **Frontend**
  - First Contentful Paint (FCP): < 1.8s
  - Largest Contentful Paint (LCP): < 2.5s
  - First Input Delay (FID): < 100ms
  - Cumulative Layout Shift (CLS): < 0.1
  - Time to First Byte (TTFB): < 800ms
  - Interaction to Next Paint (INP): < 200ms

- **Backend**
  - Average API response time: < 100ms
  - P95 response time: < 200ms
  - P99 response time: < 500ms
  - Error rate: < 0.1%
  - Throughput: > 1000 req/s

- **Database**
  - Average query time: < 10ms
  - P95 query time: < 50ms
  - Slow query rate: < 1%
  - Connection pool utilization: < 75%

## Frontend Performance

### 1. Bundle Optimization

#### Code Splitting

```typescript
// Use dynamic imports for route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
```

#### Tree Shaking

Ensure imports are ES6 modules to enable tree shaking:

```typescript
// Good - allows tree shaking
import { Button, Card } from '@ui/components';

// Bad - imports entire library
import * as Components from '@ui/components';
```

#### Bundle Analysis

Run bundle analysis to identify optimization opportunities:

```bash
# Analyze bundle size
pnpm run build:analyze

# Run performance analysis
pnpm run build:perf
```

### 2. Asset Optimization

#### Images

```typescript
// Use modern image formats
<picture>
  <source srcSet="image.avif" type="image/avif" />
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" loading="lazy" />
</picture>

// Implement responsive images
<img
  srcSet="image-320w.jpg 320w, image-640w.jpg 640w, image-1280w.jpg 1280w"
  sizes="(max-width: 320px) 280px, (max-width: 640px) 600px, 1200px"
  src="image-640w.jpg"
  alt="Description"
/>
```

#### Fonts

```css
/* Optimize font loading */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap;
  unicode-range: U+0020-007F; /* Latin */
}

/* Preload critical fonts */
<link
  rel="preload"
  href="/fonts/custom.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

### 3. Runtime Performance

#### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(
    () => expensiveOperation(data),
    [data]
  );

  const handleClick = useCallback(() => {
    // Handle click
  }, []);

  return <div onClick={handleClick}>{processedData}</div>;
});
```

#### Virtualization

```typescript
import { FixedSizeList } from 'react-window';

function LargeList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>{items[index]}</div>
      )}
    </FixedSizeList>
  );
}
```

### 4. Web Vitals Tracking

```typescript
import { createWebVitalsMonitor } from '@tnf/core-monitoring';

// Initialize Web Vitals monitoring
const vitalsMonitor = await createWebVitalsMonitor({
  enabled: true,
  reportUrl: '/api/analytics/vitals',
  sampleRate: 1.0,
  reportAllChanges: false,
  onReport: (report) => {
    console.log('Web Vitals Report:', report);

    // Send to analytics
    analytics.track('web_vitals', {
      url: report.url,
      vitals: report.vitals,
      sessionId: report.sessionId,
    });
  },
});

// Track custom metrics
vitalsMonitor.trackCustomMetric('time-to-interactive', performance.now());
```

## Backend Performance

### 1. API Optimization

#### Caching

```typescript
import { Cache } from '@nestjs/cache-manager';

@Injectable()
export class UsersService {
  constructor(private cacheManager: Cache) {}

  async getUser(id: string) {
    const cacheKey = `user:${id}`;

    // Check cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Fetch from database
    const user = await this.db.user.findUnique({ where: { id } });

    // Store in cache (1 hour TTL)
    await this.cacheManager.set(cacheKey, user, 3600);

    return user;
  }
}
```

#### Request Batching

```typescript
import DataLoader from 'dataloader';

class UserLoader {
  private loader = new DataLoader(async (ids: string[]) => {
    const users = await this.db.user.findMany({
      where: { id: { in: ids } },
    });

    return ids.map(id => users.find(u => u.id === id));
  });

  async load(id: string) {
    return this.loader.load(id);
  }
}
```

#### Response Compression

```typescript
import compression from 'compression';

// Enable gzip/brotli compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9)
}));
```

### 2. APM Integration

```typescript
import { createAPMFromEnv, APMService } from '@tnf/core-monitoring';

// Initialize APM
const apm = createAPMFromEnv();
await apm.initialize();

// Track HTTP requests
@Injectable()
export class AppInterceptor implements NestInterceptor {
  constructor(private apm: APMService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const transaction = this.apm.startTransaction(
      `${request.method} ${request.url}`,
      'request'
    );

    this.apm.setTransactionContext(transaction.id, {
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
      },
    });

    return next.handle().pipe(
      tap(() => {
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

## Database Performance

### 1. Query Optimization

#### Use Proper Indexes

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Composite indexes for complex queries
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
```

#### Optimize Queries

```typescript
// Bad - N+1 query problem
const users = await db.user.findMany();
for (const user of users) {
  const orders = await db.order.findMany({
    where: { userId: user.id },
  });
}

// Good - Use includes/joins
const users = await db.user.findMany({
  include: {
    orders: true,
  },
});

// Even better - Select only needed fields
const users = await db.user.findMany({
  select: {
    id: true,
    name: true,
    orders: {
      select: {
        id: true,
        total: true,
      },
    },
  },
});
```

### 2. Database Monitoring

```typescript
import { createDatabaseMonitorFromEnv } from '@tnf/core-monitoring';

// Initialize database monitoring
const dbMonitor = createDatabaseMonitorFromEnv();
await dbMonitor.initialize();

// Track queries
await dbMonitor.trackQueryExecution(
  'postgres',
  'SELECT * FROM users WHERE id = $1',
  async () => {
    return db.user.findUnique({ where: { id } });
  },
  {
    operation: 'SELECT',
    table: 'users',
  }
);

// Record connection pool metrics
dbMonitor.recordPoolMetrics('postgres', {
  total: 10,
  active: 5,
  idle: 4,
  waiting: 1,
});

// Get slow queries
const slowQueries = dbMonitor.getSlowQueries(10);
console.log('Top 10 slow queries:', slowQueries);
```

### 3. Connection Pool Management

```typescript
// Drizzle connection pool configuration
const drizzle = new DrizzleClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  connection: {
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
  },
});
```

## Monitoring & Metrics

### 1. Performance Dashboard

```typescript
import { performanceDashboard } from '@tnf/core-monitoring';

// Add metrics to dashboard
performanceDashboard.addMetrics({
  timestamp: Date.now(),
  frontend: {
    webVitals: {
      fcp: { current: 1200, rating: 'good', trend: 'stable', change: 0 },
      lcp: { current: 2000, rating: 'good', trend: 'down', change: -200 },
      // ... other vitals
    },
    bundleSize: { total: 450000, js: 300000, css: 50000, images: 100000 },
    loadTime: { total: 2500, domInteractive: 1800, domComplete: 2300 },
    resourceCount: { total: 45, scripts: 12, stylesheets: 5, images: 28 },
  },
  backend: {
    requests: { total: 10000, successful: 9950, failed: 50, rate: 100 },
    latency: { avg: 85, p50: 70, p95: 150, p99: 300 },
    activeTransactions: 25,
    errors: { total: 50, rate: 0.005 },
  },
  database: {
    queries: { total: 50000, slow: 100, failed: 5, avgDuration: 8 },
    connectionPool: { total: 10, active: 5, idle: 4, utilization: 50 },
    topQueries: [],
  },
  infrastructure: {
    cpu: { usage: 45, cores: 4 },
    memory: { used: 2048, total: 4096, utilization: 50 },
    disk: { used: 10000, total: 50000, utilization: 20 },
  },
});

// Get current status
const summary = performanceDashboard.getSummary();
console.log('Overall health:', summary.overall);
console.log('Critical alerts:', summary.criticalAlerts);
```

### 2. Alerts Configuration

Performance alerts are automatically generated based on thresholds defined in `performance-budgets.json`.

## Performance Budgets

Performance budgets are defined in `/performance-budgets.json`:

```json
{
  "frontend": {
    "bundle": {
      "maxSize": "500kb",
      "maxGzipSize": "150kb"
    }
  },
  "performance": {
    "webVitals": {
      "FCP": { "budget": 1800 },
      "LCP": { "budget": 2500 },
      "FID": { "budget": 100 }
    }
  }
}
```

### Enforcing Budgets

Budgets are enforced in CI/CD:

```yaml
# .github/workflows/quality.yml
- name: Check performance budgets
  run: pnpm run perf:check
```

## Optimization Workflow

### 1. Measure

```bash
# Run Lighthouse CI
pnpm run lighthouse

# Analyze bundle size
pnpm run build:analyze

# Run load tests
./scripts/performance/load-test.sh
```

### 2. Identify Issues

```bash
# Check slow queries
pnpm run db:slow-queries

# Analyze backend performance
pnpm run perf:backend

# Review Web Vitals
pnpm run perf:vitals
```

### 3. Optimize

Apply optimizations based on findings:

- Frontend: Code splitting, lazy loading, image optimization
- Backend: Caching, query optimization, response compression
- Database: Indexing, connection pooling, query batching

### 4. Verify

```bash
# Run performance tests
pnpm run test:performance

# Check budgets
pnpm run perf:check

# Generate report
pnpm run perf:report
```

## Tools & Scripts

### Available Scripts

```bash
# Frontend
pnpm run build:analyze          # Analyze bundle size
pnpm run build:perf             # Performance analysis
pnpm run lighthouse             # Run Lighthouse CI

# Backend
pnpm run perf:test              # Performance tests
./scripts/performance/load-test.sh  # Load testing

# Database
pnpm run db:slow-queries        # Show slow queries
pnpm run db:analyze             # Database analysis

# Reports
pnpm run perf:report            # Generate performance report
pnpm run perf:dashboard         # View dashboard
```

### Continuous Monitoring

Enable continuous monitoring in production:

```typescript
// apps/frontend/src/main.tsx
import { createWebVitalsMonitor } from '@tnf/core-monitoring';

if (import.meta.env.PROD) {
  createWebVitalsMonitor({
    enabled: true,
    reportUrl: '/api/analytics/vitals',
    sampleRate: 0.1, // Sample 10% of users
  });
}
```

## Best Practices

1. **Monitor Continuously**: Set up automated monitoring and alerting
2. **Test Regularly**: Run performance tests on every PR
3. **Set Budgets**: Define and enforce performance budgets
4. **Optimize Early**: Address performance issues during development
5. **Measure Impact**: Track metrics before and after optimizations
6. **Document Findings**: Keep a record of optimization efforts
7. **Stay Updated**: Review performance metrics regularly

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Performance Best Practices](https://web.dev/fast/)
- [React Performance](https://react.dev/learn/render-and-commit)

## Related Documentation

- [Monitoring Setup](../monitoring/MONITORING_SETUP.md)
- [Alert Runbooks](../monitoring/ALERT_RUNBOOKS.md)
- [Deployment Guide](../guides/deployment-guide.md)
