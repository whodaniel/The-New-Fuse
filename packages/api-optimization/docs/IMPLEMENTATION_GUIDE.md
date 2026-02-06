# API Optimization - Implementation Guide

Complete guide to implementing API optimization features in The New Fuse
platform.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Implementation Steps](#implementation-steps)
4. [Integration with Existing Apps](#integration)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## Installation

### 1. Install the Package

```bash
# From workspace root
pnpm add @the-new-fuse/api-optimization --filter @the-new-fuse/api-server
```

### 2. Install Redis

```bash
# Using Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine redis-server --requirepass your_password

# Or using Homebrew (macOS)
brew install redis
brew services start redis
```

## Configuration

### Environment Variables

Create or update `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password

# Rate Limiting
RATE_LIMIT_ENABLED=true

# Backpressure
BACKPRESSURE_ENABLED=true
BACKPRESSURE_MAX_CONCURRENT=100
BACKPRESSURE_MAX_QUEUE=50
BACKPRESSURE_TIMEOUT=30000
BACKPRESSURE_SLOWDOWN_THRESHOLD=80

# Caching
CACHE_TTL=300
CACHE_WARM_ON_STARTUP=true
CACHE_STATIC_MAX_AGE=31536000
CACHE_API_MAX_AGE=300

# CDN Configuration (optional)
CDN_ENABLED=false
CDN_PROVIDER=cloudflare
CDN_DOMAIN=cdn.example.com
CDN_API_KEY=your_api_key
CDN_ZONE_ID=your_zone_id
```

## Implementation Steps

### Step 1: Import Module

In your main application module (e.g., `apps/api/src/app.module.ts`):

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiOptimizationModule } from '@the-new-fuse/api-optimization';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ApiOptimizationModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### Step 2: Configure Middleware

In your `main.ts` or `app.module.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  RateLimitMiddleware,
  CacheHeadersMiddleware,
  BackpressureMiddleware,
} from '@the-new-fuse/api-optimization';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get middleware instances
  const rateLimitMiddleware = app.get(RateLimitMiddleware);
  const cacheHeadersMiddleware = app.get(CacheHeadersMiddleware);
  const backpressureMiddleware = app.get(BackpressureMiddleware);

  // Apply middleware globally
  app.use(backpressureMiddleware.use.bind(backpressureMiddleware));
  app.use(cacheHeadersMiddleware.use.bind(cacheHeadersMiddleware));
  app.use(rateLimitMiddleware.use.bind(rateLimitMiddleware));

  await app.listen(3000);
}
bootstrap();
```

### Step 3: Implement Rate Limiting

#### Option A: Global Guards

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from '@the-new-fuse/api-optimization';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
```

#### Option B: Controller-Level

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  RateLimitGuard,
  RateLimit,
  RateLimitPresets,
} from '@the-new-fuse/api-optimization';

@Controller('users')
@UseGuards(RateLimitGuard)
export class UsersController {
  @Get()
  @RateLimit(RateLimitPresets.STANDARD)
  getUsers() {
    return this.usersService.findAll();
  }

  @Get('search')
  @RateLimit(RateLimitPresets.SEARCH)
  searchUsers() {
    return this.usersService.search();
  }
}
```

### Step 4: Implement Response Caching

#### Option A: Global Interceptors

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheInterceptor } from '@the-new-fuse/api-optimization';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
```

#### Option B: Controller-Level

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import {
  CacheInterceptor,
  CacheResponse,
  CachePresets,
} from '@the-new-fuse/api-optimization';

@Controller('dashboard')
@UseInterceptors(CacheInterceptor)
export class DashboardController {
  @Get()
  @CacheResponse(CachePresets.DASHBOARD)
  getDashboard() {
    return this.dashboardService.getData();
  }
}
```

### Step 5: Implement Cache Invalidation

```typescript
import { Injectable } from '@nestjs/common';
import {
  CacheInvalidationService,
  InvalidateCache,
} from '@the-new-fuse/api-optimization';

@Injectable()
export class UsersService {
  constructor(private invalidationService: CacheInvalidationService) {}

  @InvalidateCache(['users', 'dashboard'])
  async updateUser(userId: string, data: UpdateUserDto) {
    const user = await this.userRepository.update(userId, data);

    // Smart invalidation
    await this.invalidationService.invalidateEntity('user', userId);

    return user;
  }
}
```

### Step 6: Implement Quota Management

```typescript
import { Injectable } from '@nestjs/common';
import { QuotaManagementService } from '@the-new-fuse/api-optimization';

@Injectable()
export class ApiService {
  constructor(private quotaService: QuotaManagementService) {}

  async handleRequest(userId: string) {
    // Get user tier from database
    const userTier = await this.getUserTier(userId);

    // Check quota
    const result = await this.quotaService.consumeQuota(userId, userTier);

    if (!result.allowed) {
      throw new ForbiddenException({
        message: 'Quota exceeded',
        quotas: result.usage,
      });
    }

    // Process request
    return this.processRequest();
  }
}
```

### Step 7: Implement Cache Warming

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { CacheWarmingService } from '@the-new-fuse/api-optimization';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private warmingService: CacheWarmingService) {}

  async onModuleInit() {
    // Add custom warming strategies
    this.warmingService.addStrategy({
      name: 'popular-agents',
      enabled: true,
      priority: 1,
      tags: ['agents', 'popular'],
      urls: ['/api/agents/popular', '/api/agents/trending'],
    });

    // Warm on startup (already happens automatically)
    // Can also schedule periodic warming
    this.schedulePeriodicWarming();
  }

  private schedulePeriodicWarming() {
    // Warm every 10 minutes
    this.warmingService.scheduleWarming(
      {
        name: 'critical-data',
        enabled: true,
        priority: 1,
        tags: ['critical', 'dashboard'],
      },
      600000
    );
  }
}
```

### Step 8: Implement Monitoring

```typescript
import { Controller, Get } from '@nestjs/common';
import {
  OptimizationMonitoringService,
  SkipRateLimit,
} from '@the-new-fuse/api-optimization';

@Controller('monitoring')
export class MonitoringController {
  constructor(private monitoringService: OptimizationMonitoringService) {}

  @Get('metrics')
  @SkipRateLimit()
  async getMetrics() {
    return this.monitoringService.getMetrics();
  }

  @Get('health')
  @SkipRateLimit()
  async getHealth() {
    return this.monitoringService.getHealthStatus();
  }

  @Get('report')
  @SkipRateLimit()
  async getReport() {
    return this.monitoringService.generateReport();
  }
}
```

## Integration with Existing Apps

### API Gateway (`apps/api-gateway`)

```typescript
// apps/api-gateway/src/app.module.ts
import { Module } from '@nestjs/common';
import { ApiOptimizationModule } from '@the-new-fuse/api-optimization';

@Module({
  imports: [
    ApiOptimizationModule,
    // existing modules...
  ],
})
export class AppModule {}

// apps/api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BackpressureMiddleware,
  CacheHeadersMiddleware,
} from '@the-new-fuse/api-optimization';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply middleware
  const backpressure = app.get(BackpressureMiddleware);
  const cacheHeaders = app.get(CacheHeadersMiddleware);

  app.use(backpressure.use.bind(backpressure));
  app.use(cacheHeaders.use.bind(cacheHeaders));

  await app.listen(3000);
}
bootstrap();
```

### API Server (`apps/api`)

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import {
  ApiOptimizationModule,
  RateLimitGuard,
  CacheInterceptor,
} from '@the-new-fuse/api-optimization';

@Module({
  imports: [ApiOptimizationModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
```

### Backend (`apps/backend`)

```typescript
// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ApiOptimizationModule } from '@the-new-fuse/api-optimization';

@Module({
  imports: [
    ApiOptimizationModule,
    // existing modules...
  ],
})
export class AppModule {}
```

## Testing

### Unit Tests

```typescript
import { Test } from '@nestjs/testing';
import { RedisRateLimiterService } from '@the-new-fuse/api-optimization';
import { ConfigService } from '@nestjs/config';

describe('RedisRateLimiterService', () => {
  let service: RedisRateLimiterService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RedisRateLimiterService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get(RedisRateLimiterService);
  });

  it('should consume rate limit', async () => {
    const result = await service.consume('test-key', {
      points: 10,
      duration: 60,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThan(10);
  });
});
```

### Integration Tests

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should rate limit requests', async () => {
    // Make 100 requests (should succeed)
    for (let i = 0; i < 100; i++) {
      await request(app.getHttpServer()).get('/api/users').expect(200);
    }

    // 101st request should be rate limited
    await request(app.getHttpServer()).get('/api/users').expect(429);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Load Testing

```bash
# Install Apache Bench
brew install ab  # macOS
apt-get install apache2-utils  # Linux

# Test rate limiting
ab -n 1000 -c 10 http://localhost:3000/api/users

# Test with authentication
ab -n 1000 -c 10 -H "Authorization: Bearer token" http://localhost:3000/api/users

# Monitor results
ab -n 10000 -c 50 -g results.tsv http://localhost:3000/api/users
```

## Deployment

### Docker Configuration

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build
RUN npm run build

# Environment
ENV NODE_ENV=production
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

# Expose port
EXPOSE 3000

# Start
CMD ["node", "dist/main.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}

  api:
    build: ./apps/api
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    depends_on:
      - redis

volumes:
  redis-data:
```

### Kubernetes

```yaml
# k8s/redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
          env:
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: redis-secret
                  key: password

---
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: your-registry/api:latest
          ports:
            - containerPort: 3000
          env:
            - name: REDIS_HOST
              value: redis-service
            - name: REDIS_PORT
              value: '6379'
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: redis-secret
                  key: password
```

## Monitoring

### Prometheus Metrics

```typescript
// Create metrics endpoint
import { Controller, Get } from '@nestjs/common';
import {
  OptimizationMonitoringService,
  SkipRateLimit,
} from '@the-new-fuse/api-optimization';

@Controller('metrics')
export class MetricsController {
  constructor(private monitoring: OptimizationMonitoringService) {}

  @Get()
  @SkipRateLimit()
  async getMetrics() {
    const metrics = await this.monitoring.getMetrics();

    // Convert to Prometheus format
    return `
# HELP rate_limit_blocked_keys Number of blocked rate limit keys
# TYPE rate_limit_blocked_keys gauge
rate_limit_blocked_keys ${metrics.rateLimit.blockedKeys}

# HELP cache_hit_rate Cache hit rate percentage
# TYPE cache_hit_rate gauge
cache_hit_rate ${metrics.cache.hitRate}

# HELP cache_memory_size Memory cache size
# TYPE cache_memory_size gauge
cache_memory_size ${metrics.cache.memoryCacheSize}
    `;
  }
}
```

### Grafana Dashboard

Import the included Grafana dashboard JSON or create custom panels:

- Rate limit metrics
- Cache hit rates
- Backpressure status
- Quota usage
- Performance metrics

## Troubleshooting

### Issue: Rate Limiting Not Working

**Symptoms:**

- No rate limiting applied
- All requests allowed

**Solutions:**

1. Check Redis connection
2. Verify middleware is applied
3. Check environment variables
4. Review logs for errors

```typescript
// Test Redis connection
const health = await rateLimiter.healthCheck();
console.log('Redis health:', health);
```

### Issue: Cache Not Working

**Symptoms:**

- Low hit rate
- No cached responses

**Solutions:**

1. Check Redis connection
2. Verify interceptor is applied
3. Check cache keys
4. Review TTL settings

```typescript
// Test cache
const stats = cacheService.getStats();
console.log('Cache stats:', stats);
```

### Issue: High Memory Usage

**Symptoms:**

- Memory keeps growing
- Redis memory full

**Solutions:**

1. Reduce cache TTL
2. Implement eviction policies
3. Review cache size limits
4. Monitor memory usage

```bash
# Check Redis memory
redis-cli INFO memory
```

### Issue: Performance Degradation

**Symptoms:**

- Slow responses
- High latency

**Solutions:**

1. Check Redis latency
2. Review cache hit rate
3. Monitor backpressure
4. Scale Redis if needed

```bash
# Check Redis latency
redis-cli --latency
```

## Next Steps

1. Review [CACHING_POLICY.md](./CACHING_POLICY.md)
2. Review [RATE_LIMITING_POLICY.md](./RATE_LIMITING_POLICY.md)
3. Configure monitoring and alerting
4. Set up Grafana dashboards
5. Conduct load testing
6. Review and adjust limits based on metrics

## Support

For issues or questions:

- Check documentation
- Review logs
- Contact development team
- Submit issue on GitHub
