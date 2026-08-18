# TNF Browser Control Integration Guide

## Overview

This guide explains how to integrate browser control capabilities across TNF's
frontend, Tauri desktop, and Chrome extension components.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TNF Browser Control Stack                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Frontend  │    │   Tauri     │    │ Chrome Ext  │     │
│  │   (Browser) │    │   Desktop   │    │   (v5/v6)   │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│         │                    │                    │          │
│         └────────────────────┼────────────────────┘          │
│                              │                               │
│                     ┌────────▼────────┐                    │
│                     │  TnfBrowser     │                    │
│                     │    Service      │                    │
│                     │(Core Interface) │                    │
│                     └────────┬────────┘                    │
│                              │                               │
│                     ┌────────▼────────┐                    │
│                     │  Agent-Browser  │                    │
│                     │    Skill        │                    │
│                     └────────┬────────┘                    │
│                              │                               │
│                     ┌────────▼────────┐                    │
│                     │  Frontend API   │                    │
│                     │     Layer       │                    │
│                     └────────┬────────┘                    │
│                              │                               │
│                     ┌────────▼────────┐                    │
│                     │  Rate Limiter   │                    │
│                     │   (Redis)       │                    │
│                     └─────────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Usage Examples

### 1. Frontend Browser Automation

```typescript
import TnfBrowserService from './services/TnfBrowserService';

// Start browser runtime
await TnfBrowserService.startRuntime();

// Navigate to page
await TnfBrowserService.navigate('https://example.com');

// Create new tab
const tab = await TnfBrowserService.createTab();

// Screenshot full page
const screenshot = await TnfBrowserService.screenshot(true, tab.id);

// Discover elements
const elements = await TnfBrowserService.discover(tab.id);

// Click element
await TnfBrowserService.click('#submit-button', tab.id);

// Type text
await TnfBrowserService.type('Hello World', 'input[name="query"]', tab.id);
```

### 2. Agent-Browser Skill Usage

```python
# Python example (via HTTP bridge)
import requests

AGENT_BROWSER = "agent-browser"

def automate_task():
    # Open page
    requests.post(f"{BROWSER_URL}/command", json={
        "action": "tabs.navigate",
        "params": {"url": "https://example.com"}
    })

    # Take screenshot
    response = requests.post(f"{BROWSER_URL}/command", json={
        "action": "tabs.screenshot",
        "params": {"fullPage": True}
    })

    return response.json()
```

### 3. Tauri Desktop Browser Service

```typescript
import TnfBrowserService from '../services/TnfBrowserService';

// In your Tauri command
async function browserAction(url: string) {
  // Ensure browser service is connected
  const status = await TnfBrowserService.status();

  if (!status.connected) {
    await TnfBrowserService.connect();
  }

  // Perform actions with Redis caching for rate limiting
  const canProceed = await redisCache.checkRateLimit('browser-op', 100, 60);

  if (canProceed) {
    const result = await TnfBrowserService.navigate(url);
    return result;
  }

  throw new Error('Rate limit exceeded');
}
```

## Rate Limiting Strategy

The Redis cache layer provides Redis-based rate limiting:

```typescript
// Per-agent rate limiting
const agentLimit = await redisCache.checkRateLimit(
  `agent:${agentId}:browser`,
  100,
  60 // 100 ops per minute
);

// Global rate limiting
const globalLimit = await redisCache.checkRateLimit(
  'global:browser',
  1000,
  60 // 1000 ops per minute
);

// Custom window with burst allowance
const burstLimit = await redisCache.checkRateLimit(
  `burst:${userId}`,
  50,
  5 // 50 ops per 5 seconds
);
```

## Troubleshooting

### ResourceExhausted Errors

If you see `Worker local total request limit reached` errors:

1. **Enable Redis caching**:

   ```bash
   kubectl apply -f infrastructure/redis/redis-deployment.yaml
   ```

2. **Configure rate limiting**:

   ```typescript
   // Add to your agent initialization
   const maxRequests = 100;
   const window = 60; // seconds

   const canProceed = await redisCache.checkRateLimit(
     `agent:${agent.id}`,
     maxRequests,
     window * 1000
   );
   ```

3. **Monitor with HPA**:
   ```bash
   kubectl apply -f infrastructure/hpa/hpa-config.yaml
   ```

### Browser Not Responding

1. Check Redis connection: `redis-cli ping`
2. Check browser runtime: `TnfBrowserService.status()`
3. Restart if needed: `TnfBrowserService.disconnect() / connect()`

## Performance Optimization

### Cache Strategy

```typescript
// Cache frequently accessed pages
const cached = await redisCache.get(`page:${url}`);
if (cached) {
  return cached;
}

// Perform operation
const result = await browserService.discover(url);

// Cache result for 1 hour
await redisCache.set(`page:${url}`, result, 3600000);
```

### Pipeline Operations

For batch operations:

```typescript
await redisCache.pipeline([
  () => redisCache.set('key1', value1),
  () => redisCache.set('key2', value2),
  () => redisCache.get('key3'),
]);
```

## Migration Checklist

- [ ] Deploy Redis cluster
- [ ] Configure HPA policies
- [ ] Apply load balancer configs
- [ ] Update agent to use Redis cache
- [ ] Set rate limits per agent/workspace
- [ ] Enable monitoring alerts
- [ ] Test failover scenarios

## Support

For issues or questions:

1. Check the monitoring dashboards
2. Review Redis logs: `kubectl logs -l app=tnf-redis`
3. File an issue with logs from all components
