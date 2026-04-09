# Rate Limiting Policy

## Overview

This document defines the rate limiting policies and strategies for The New Fuse API to ensure fair usage, prevent abuse, and maintain system stability.

## Rate Limiting Strategy

### Algorithm: Sliding Window

We use a sliding window algorithm for accurate, distributed rate limiting:

```
Time Window: 60 seconds
Max Requests: 100

[===|===|===|===|===|===]
 0  10  20  30  40  50  60s
        ↑
    Current Time

Requests in sliding window (last 60s) = 87
Remaining = 100 - 87 = 13
```

**Benefits:**
- More accurate than fixed windows
- Prevents burst at window boundaries
- Fair distribution across time
- Distributed across servers (Redis-backed)

## Rate Limit Tiers

### Free Tier

```typescript
{
  hourly: 1,000 requests    // 16.6 req/min
  daily: 10,000 requests    // 416 req/hour
  monthly: 100,000 requests // 3,333 req/day
}
```

**Target Users:** Free users, trial accounts

### Pro Tier

```typescript
{
  hourly: 10,000 requests    // 166 req/min
  daily: 100,000 requests    // 4,166 req/hour
  monthly: 1,000,000 requests // 33,333 req/day
}
```

**Target Users:** Paid individual users, small teams

### Enterprise Tier

```typescript
{
  hourly: 100,000 requests    // 1,666 req/min
  daily: 1,000,000 requests   // 41,666 req/hour
  monthly: 10,000,000 requests // 333,333 req/day
}
```

**Target Users:** Large organizations, high-volume users

## Endpoint-Specific Limits

### Authentication Endpoints

```typescript
{
  points: 5,          // 5 requests
  duration: 60,       // per minute
  blockDuration: 600  // block for 10 minutes
}
```

**Rationale:** Prevent brute force attacks

### Search Endpoints

```typescript
{
  points: 50,
  duration: 60,
  blockDuration: 180
}
```

**Rationale:** Expensive database queries

### File Upload Endpoints

```typescript
{
  points: 20,
  duration: 3600,     // per hour
  blockDuration: 3600
}
```

**Rationale:** Resource-intensive operations

### Read Endpoints (GET)

```typescript
{
  points: 500,
  duration: 60,
  blockDuration: 60
}
```

**Rationale:** Lower cost, higher limits

### Write Endpoints (POST/PUT/DELETE)

```typescript
{
  points: 100,
  duration: 60,
  blockDuration: 120
}
```

**Rationale:** Higher cost, data integrity concerns

## Rate Limit Headers

All API responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 2024-11-18T12:35:00Z
```

When rate limited:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-11-18T12:35:00Z
Retry-After: 45

{
  "statusCode": 429,
  "message": "Rate limit exceeded. Please try again later.",
  "error": "Too Many Requests",
  "retryAfter": 45
}
```

## Identification Methods

### Priority Order

1. **User ID** (authenticated users)
   ```
   Key: user:12345
   ```

2. **API Key** (API consumers)
   ```
   Key: apikey:abc123...
   ```

3. **IP Address** (anonymous users)
   ```
   Key: ip:192.168.1.1
   ```

### Forwarded IPs

Handle proxies and load balancers:

```typescript
const ip =
  request.headers['x-forwarded-for']?.split(',')[0] ||
  request.headers['x-real-ip'] ||
  request.connection.remoteAddress;
```

## Exemptions

### Skip Rate Limiting

- Health check endpoints (`/health`, `/readiness`)
- Metrics endpoints (`/metrics`)
- Internal service-to-service calls
- Whitelisted IPs
- Admin users (with caution)

```typescript
@Controller('health')
export class HealthController {
  @Get()
  @SkipRateLimit()
  healthCheck() {
    return { status: 'ok' };
  }
}
```

## Blocking & Penalties

### Automatic Blocking

Triggered when:
- Rate limit exceeded
- Configurable block duration per tier
- Repeated violations increase block time

```typescript
// First violation: 5 minutes
// Second violation: 15 minutes
// Third violation: 1 hour
// Persistent abuse: 24 hours or permanent
```

### Penalty System

Apply temporary rate reductions:

```typescript
// Reduce rate limit by 50% for 1 hour
await rateLimiter.applyPenalty(
  userId,
  50,  // penalty points
  3600 // duration in seconds
);
```

**Triggers:**
- Suspicious activity patterns
- Failed authentication attempts
- Malformed requests
- Unusual traffic spikes

## Monitoring & Alerts

### Metrics to Track

1. **Request Patterns**
   - Total requests per tier
   - Blocked requests
   - Top consumers
   - Geographic distribution

2. **Performance**
   - Rate limit check latency
   - Redis response time
   - False positive rate

3. **Abuse Detection**
   - Blocked key count
   - Repeated violators
   - Traffic anomalies

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Blocked Keys | >10 | >50 |
| Rate Limit Latency | >50ms | >200ms |
| Redis Errors | >1% | >5% |
| Abuse Reports | >5/hour | >20/hour |

## Best Practices

### 1. Graceful Degradation

```typescript
try {
  const result = await rateLimiter.consume(key, config);
  if (!result.allowed) {
    throw new TooManyRequestsException();
  }
} catch (error) {
  if (error instanceof RedisError) {
    // Fail open - allow request if Redis is down
    logger.error('Rate limiter Redis error:', error);
    return true;
  }
  throw error;
}
```

### 2. Clear Communication

- Include rate limit info in API documentation
- Provide clear error messages
- Show remaining quota in dashboard
- Send notifications before limits

### 3. Fair Distribution

- Use sliding windows, not fixed
- Distribute limits across time
- Avoid cascading failures
- Implement jitter in retries

### 4. Tier Upgrades

- Monitor usage patterns
- Proactively suggest upgrades
- Provide easy upgrade path
- Grandfather existing users

## Implementation Examples

### Basic Usage

```typescript
@Controller('api')
@UseGuards(RateLimitGuard)
export class ApiController {
  @Get('users')
  @RateLimit({ points: 100, duration: 60 })
  getUsers() {
    return this.usersService.findAll();
  }
}
```

### Tiered Limits

```typescript
@Get('premium')
@RateLimitTier('pro')
getPremiumFeature(@CurrentUser() user: User) {
  // Automatically uses tier from user subscription
  return this.premiumService.getData();
}
```

### Custom Limits

```typescript
@Post('upload')
@RateLimit({
  points: 10,
  duration: 3600,
  blockDuration: 7200,
  keyPrefix: 'upload'
})
uploadFile(@UploadedFile() file: Express.Multer.File) {
  return this.fileService.upload(file);
}
```

## Burst Protection

Separate burst limits from sustained rates:

```typescript
// Sustained: 100 req/min
@RateLimit({ points: 100, duration: 60 })

// Burst: 10 req/sec
@RateLimit({ points: 10, duration: 1, keyPrefix: 'burst' })
async highFrequencyEndpoint() {
  // ...
}
```

## Testing

### Load Testing

Test rate limits under load:

```bash
# Simulate 1000 req/min from single IP
ab -n 1000 -c 10 http://localhost:3000/api/users

# Expected: 100 successful, 900 rate limited
```

### Integration Tests

```typescript
describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    for (let i = 0; i < 100; i++) {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .expect(200);
    }
  });

  it('should block requests exceeding limit', async () => {
    for (let i = 0; i < 100; i++) {
      await request(app.getHttpServer()).get('/api/users');
    }

    const response = await request(app.getHttpServer())
      .get('/api/users')
      .expect(429);

    expect(response.body.message).toContain('Rate limit exceeded');
  });
});
```

## Compliance

### Legal Considerations

- Include rate limits in Terms of Service
- Provide advance notice of changes
- Honor opt-out requests
- Document enforcement procedures

### GDPR

- Don't store unnecessary identification data
- Implement data retention policies
- Provide access to rate limit logs
- Support right to be forgotten

## Troubleshooting

### False Positives

**Symptoms:**
- Legitimate users blocked
- High complaint rate
- Business impact

**Solutions:**
- Review tier assignments
- Adjust limits based on usage
- Implement manual overrides
- Whitelist specific IPs/users

### Redis Issues

**Symptoms:**
- Inconsistent rate limiting
- High latency
- Connection errors

**Solutions:**
- Check Redis health
- Scale Redis cluster
- Implement connection pooling
- Add fallback logic

### Distributed Systems

**Symptoms:**
- Different limits per server
- Race conditions
- Inconsistent state

**Solutions:**
- Use Redis for distributed state
- Implement atomic operations
- Add synchronization
- Monitor consistency

## Migration Guide

### Updating Rate Limits

1. Announce changes in advance (2+ weeks)
2. Implement gradual rollout
3. Monitor impact
4. Provide grace period
5. Full enforcement

### Example Rollout

```typescript
// Week 1-2: Warning mode (log only)
const enforceRateLimit = false;

// Week 3: Soft enforcement (high threshold)
const points = oldLimit * 1.5;

// Week 4+: Full enforcement
const points = newLimit;
```

## Review Schedule

This rate limiting policy should be reviewed:
- Monthly: Metrics and abuse patterns
- Quarterly: Tier limits and pricing
- On major releases: Implementation changes
- When issues arise: Specific problem areas
- Annually: Complete policy review
