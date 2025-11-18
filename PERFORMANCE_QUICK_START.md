# Performance Monitoring - Quick Start Guide

Get up and running with performance monitoring in 5 minutes.

## 🚀 Quick Setup

### 1. Install Dependencies (2 min)

```bash
# Install peer dependencies
pnpm add web-vitals @sentry/node winston prom-client

# Build monitoring package
cd packages/core-monitoring && pnpm build && cd ../..
```

### 2. Configure Environment (1 min)

Add to `.env.local`:

```bash
# Performance Monitoring
SENTRY_DSN=your_sentry_dsn
APM_ENABLED=true
DB_MONITORING_ENABLED=true
METRICS_ENABLED=true
```

### 3. Frontend Integration (1 min)

```typescript
// apps/frontend/src/main.tsx
import { createWebVitalsMonitor } from '@tnf/core-monitoring';

// Add before app initialization
if (import.meta.env.PROD) {
  createWebVitalsMonitor({
    enabled: true,
    reportUrl: '/api/analytics/vitals',
    sampleRate: 0.1,
  });
}
```

### 4. Backend Integration (1 min)

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { createAPMFromEnv } from '@tnf/core-monitoring';

@Module({
  providers: [
    {
      provide: 'APM',
      useFactory: async () => {
        const apm = createAPMFromEnv();
        await apm.initialize();
        return apm;
      },
    },
  ],
})
export class AppModule {}
```

## 🧪 Run Your First Tests

### Lighthouse CI
```bash
pnpm run lighthouse
```

### Bundle Analysis
```bash
pnpm run build:analyze
```

### Load Testing
```bash
./scripts/performance/load-test.sh
```

## 📊 View Results

### Dashboard
```
http://localhost:8080/monitoring/dashboard/summary
```

### Reports
- Bundle Analysis: `apps/frontend/dist/bundle-analysis.html`
- Load Test: `performance-results/sustained-load.html`
- Lighthouse: `.lighthouseci/`

## 🎯 Performance Budgets

Your app must meet these budgets:

| Metric | Budget | Status |
|--------|--------|--------|
| Bundle Size | 500KB | Auto-checked in CI |
| FCP | < 1.8s | Tracked in Web Vitals |
| LCP | < 2.5s | Tracked in Web Vitals |
| API Response | < 100ms | Tracked in APM |
| DB Query | < 10ms | Tracked in DB Monitor |

## 📈 Common Commands

```bash
# Check performance budgets
pnpm run perf:check

# Analyze bundle
pnpm run build:analyze

# Run Lighthouse
pnpm run lighthouse

# Load test
./scripts/performance/load-test.sh

# View slow queries
curl http://localhost:8080/api/monitoring/database/slow-queries
```

## 🔍 Troubleshooting

### Web Vitals not reporting?
- Check browser console
- Verify `/api/analytics/vitals` endpoint
- Check sample rate (should be > 0)

### APM not tracking?
- Verify `APM_ENABLED=true`
- Check interceptor is registered
- Review initialization logs

### Slow queries not detected?
- Verify `DB_MONITORING_ENABLED=true`
- Check threshold settings
- Review Prisma middleware

## 📚 Full Documentation

- [Performance Monitoring Setup](docs/performance/PERFORMANCE_MONITORING_SETUP.md)
- [Performance Optimization](docs/performance/PERFORMANCE_OPTIMIZATION.md)
- [Performance Overview](docs/performance/README.md)

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Frontend monitoring integrated
- [ ] Backend APM initialized
- [ ] Database monitoring active
- [ ] Lighthouse CI configured
- [ ] Bundle analysis working
- [ ] Load tests passing
- [ ] Dashboard accessible
- [ ] Alerts configured

## 🎉 You're Ready!

Your performance monitoring system is now active and tracking:

- ✅ Web Vitals (FCP, LCP, FID, CLS, TTFB, INP)
- ✅ API Performance (latency, throughput, errors)
- ✅ Database Queries (slow queries, patterns)
- ✅ Bundle Size (automatic checks in CI)
- ✅ Real-time Dashboard
- ✅ Automated Alerts

Start optimizing by reviewing the dashboard and addressing any warnings!
