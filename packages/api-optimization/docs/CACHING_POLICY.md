# Caching Policy

## Overview

This document defines the caching policies and best practices for The New Fuse
API optimization infrastructure.

## Caching Strategy

### Two-Tier Caching Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Client    │─────▶│  L1: Memory │─────▶│  L2: Redis   │─────▶ Database
│  (Browser)  │◀─────│    Cache    │◀─────│    Cache     │◀───── /API
└─────────────┘      └─────────────┘      └──────────────┘
     ▲                                            │
     │                                            │
     └─────────────── CDN Cache ──────────────────┘
```

### Cache Layers

1. **Browser Cache**: Client-side caching using HTTP cache headers
2. **CDN Cache**: Edge caching for static assets and API responses
3. **Memory Cache (L1)**: In-process LRU cache for frequently accessed data
4. **Redis Cache (L2)**: Distributed cache shared across all instances

## Cache TTL Guidelines

### By Resource Type

| Resource Type  | TTL        | Reasoning                     |
| -------------- | ---------- | ----------------------------- |
| Static Assets  | 1 year     | Immutable, versioned files    |
| User Profile   | 5 minutes  | Moderate update frequency     |
| Dashboard Data | 1 minute   | Frequently updated            |
| Search Results | 5 minutes  | Acceptable staleness          |
| Analytics      | 15 minutes | Expensive to compute          |
| Configuration  | 1 hour     | Rarely changes                |
| Public API     | 15 minutes | Balance freshness/performance |
| Authentication | 0 seconds  | Never cache sensitive data    |

### By Update Frequency

| Update Frequency | Recommended TTL  |
| ---------------- | ---------------- |
| Real-time        | 0-30 seconds     |
| High (hourly)    | 1-5 minutes      |
| Medium (daily)   | 15-60 minutes    |
| Low (weekly)     | 1-24 hours       |
| Rarely           | 1-7 days         |
| Static           | 30 days - 1 year |

## Cache Headers

### Static Assets

```http
Cache-Control: public, max-age=31536000, immutable
Expires: Thu, 31 Dec 2025 23:59:59 GMT
Vary: Accept-Encoding
ETag: "abc123"
```

### API Responses (Cacheable)

```http
Cache-Control: public, max-age=300, must-revalidate
Expires: Mon, 18 Nov 2024 12:05:00 GMT
Vary: Accept, Accept-Encoding, Authorization
ETag: "def456"
X-Cache: HIT
```

### API Responses (Non-Cacheable)

```http
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
Pragma: no-cache
Expires: 0
```

## Cache Invalidation Strategies

### 1. Tag-Based Invalidation

Group related cache entries with tags for efficient bulk invalidation:

```typescript
// Set cache with tags
await cache.set('user:123', userData, {
  ttl: 300,
  tags: ['users', 'user:123', 'dashboard'],
});

// Invalidate all user-related caches
await cache.invalidateByTag('users');
```

**Use cases:**

- User updates: Invalidate all user-related caches
- Entity changes: Invalidate entity and dependent caches
- Bulk operations: Invalidate entire categories

### 2. Pattern-Based Invalidation

Invalidate caches matching a pattern:

```typescript
// Invalidate all workflow caches
await cache.invalidateByPattern('cache:*workflow*');
```

**Use cases:**

- Wildcard invalidation
- Namespace cleanup
- Testing and development

### 3. Time-Based Invalidation

Automatic expiration using TTL:

```typescript
// Cache expires after TTL
await cache.set('analytics:daily', data, { ttl: 86400 });
```

**Use cases:**

- Predictable refresh cycles
- Resource optimization
- Scheduled updates

### 4. Event-Based Invalidation

Invalidate on specific events:

```typescript
// On user update event
eventEmitter.on('user.updated', async (userId) => {
  await cache.invalidateByTag(`user:${userId}`);
});
```

**Use cases:**

- Real-time updates
- Webhook handling
- Message queue processing

## Cache Warming

### Critical Data Preloading

Warm cache on startup and periodically for critical data:

```typescript
{
  name: 'critical-endpoints',
  enabled: true,
  priority: 1,
  urls: [
    '/api/dashboard',
    '/api/users/me',
    '/api/agents',
    '/api/workflows'
  ],
  tags: ['dashboard', 'users', 'agents', 'workflows']
}
```

### Warming Strategies

1. **On Startup**: Preload frequently accessed data
2. **Scheduled**: Periodic warming (e.g., every hour)
3. **Predictive**: Warm based on usage patterns
4. **Event-Driven**: Warm after deployments or updates

## Best Practices

### 1. Cache What's Expensive

Prioritize caching for:

- Database queries
- API calls to external services
- Complex computations
- Aggregations and analytics

### 2. Don't Cache Sensitive Data

Never cache:

- Authentication tokens
- User credentials
- Personal financial information
- Temporary session data

### 3. Use Appropriate TTL

- **Too short**: Defeats caching purpose, increases load
- **Too long**: Serves stale data, wastes memory
- **Just right**: Balance between freshness and performance

### 4. Implement Cache Versioning

Include version in cache keys for safe updates:

```typescript
const cacheKey = `users:v2:${userId}`;
```

### 5. Monitor Cache Performance

Track:

- Hit rate (target: >70%)
- Memory usage
- Invalidation frequency
- Response time improvements

### 6. Handle Cache Failures Gracefully

```typescript
try {
  const cached = await cache.get(key);
  if (cached) return cached;
} catch (error) {
  logger.error('Cache error:', error);
  // Fall through to fetch from source
}

const data = await fetchFromSource();
return data;
```

## Cache Key Naming Convention

Use structured, hierarchical keys:

```
{namespace}:{entity}:{id}:{version}
```

Examples:

- `cache:user:123:v1`
- `cache:workflow:abc:v2`
- `cache:analytics:daily:2024-11-18:v1`

## Cache Size Limits

### Memory Cache (L1)

- Maximum items: 500
- Maximum size: 50MB
- Eviction: LRU (Least Recently Used)

### Redis Cache (L2)

- Maximum size: Configured per instance
- Eviction: allkeys-lru
- Monitoring: Track memory usage

## Performance Targets

| Metric                   | Target | Critical |
| ------------------------ | ------ | -------- |
| Cache Hit Rate           | >70%   | <50%     |
| Response Time (cached)   | <10ms  | >50ms    |
| Response Time (uncached) | <200ms | >1000ms  |
| Memory Usage             | <80%   | >95%     |
| Invalidation Time        | <100ms | >500ms   |

## Troubleshooting

### Low Hit Rate

**Symptoms:**

- Hit rate <50%
- High database load
- Slow response times

**Solutions:**

- Increase TTL for stable data
- Review cache key generation
- Check invalidation frequency
- Analyze access patterns

### High Memory Usage

**Symptoms:**

- Memory >90%
- Frequent evictions
- Cache misses for recent data

**Solutions:**

- Reduce cache size or TTL
- Implement compression
- Review cached data size
- Increase memory allocation

### Stale Data

**Symptoms:**

- Users see outdated information
- Inconsistent responses
- Invalidation not working

**Solutions:**

- Reduce TTL
- Implement proper invalidation
- Use event-driven invalidation
- Review cache dependencies

## Compliance

### GDPR & Privacy

- Don't cache personal data longer than necessary
- Implement cache invalidation for user deletion
- Use encryption for cached sensitive data
- Document data retention policies

### Security

- Never cache authentication tokens
- Use secure Redis connections (TLS)
- Implement access controls
- Audit cache access patterns

## Migration Guide

### Updating Cache Schema

1. Create new cache key version
2. Populate new cache alongside old
3. Update code to use new version
4. Monitor for issues
5. Remove old cache version after transition

### Example

```typescript
// Old version
const oldKey = `user:${userId}`;

// New version with schema change
const newKey = `user:v2:${userId}`;

// Dual read during migration
let data = await cache.get(newKey);
if (!data) {
  data = await cache.get(oldKey);
  if (data) {
    // Migrate to new version
    await cache.set(newKey, transformData(data));
  }
}
```

## Review Schedule

This caching policy should be reviewed:

- Quarterly: Performance metrics and targets
- On major releases: Cache schema and strategies
- When issues arise: Specific problem areas
- Annually: Complete policy review
