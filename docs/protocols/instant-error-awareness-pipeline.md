# Instant Error Awareness Pipeline

**Status:** Live  
**Created:** 2026-08-12  
**Endpoint:** `POST /api/error-awareness/report`

## Overview

The Instant Error Awareness Pipeline provides real-time frontend error detection, automatic fleet-based routing, and Master Director notification for the TNF platform.

## Architecture

```
SPA (apps/frontend)
  │
  ├─ Inline Guard (app.html) ── captures pre-boot errors
  │     │
  │     └─ beacon → /api/error-awareness/report
  │
  └─ installErrorAwareness() (main.tsx) ── full capture module
        │
        ├─ window.onerror handler
        ├─ unhandledrejection handler
        ├─ resource load failure handler
        ├─ console.error wrapper
        └─ batch flush on pagehide
            │
            ▼
Backend API (apps/api/src/modules/error-awareness/)
  │
  ├─ ErrorAwarenessController (/error-awareness/report, /batch, /recent, /stats)
  ├─ ErrorAwarenessService (Redis logging, task creation, de-duplication)
  ├─ AgentRouting (category→fleet expert mapping)
  └─ ErrorAwarenessModule
            │
            ▼
Redis Channels
  ├─ tnf:master:tasks:realtime (LPUSH director task)
  └─ tnf:error:awareness (PubSub broadcast)
            │
            ▼
Master Director → Fleet Expert Agent
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/error-awareness/report` | Single error beacon (sendBeacon/fetch) |
| POST | `/api/error-awareness/batch` | Batch error reports (flushed on pagehide) |
| POST | `/api/error-awareness/manual` | Manual report from app code |
| GET | `/api/error-awareness/recent?limit=N` | Recent errors (in-memory ring buffer) |
| GET | `/api/error-awareness/stats` | Category counts |

## Error Categories & Routing

| Category | Agent | Priority (error/warning/info) |
|----------|-------|-------------------------------|
| `runtime` | frontend-debugger-agent | high/medium/low |
| `react` | frontend-debugger-agent | critical/high/medium |
| `chunk-load` | devops-agent | critical/high/medium |
| `resource` | frontend-specialist | high/medium/low |
| `network` | backend-specialist | high/medium/low |
| `promise` | debugger | high/medium/low |
| `console` | codequality-agent | medium/low/low |

## Fingerprint Overrides (Content-based Routing)

| Pattern | Agent | Priority |
|---------|-------|----------|
| `auth|unauthor|401|403|jwt|supabase.*token` | auth-flow-qa-agent | critical |
| `database|drizzle|pg|postgres|query.*failed|connection.*refused|sql` | database-architect | high |
| `redis|cache.*miss|queue|rpop|lpush|relay` | devops-engineer | high |
| `relay|websocket|ws://|wss://|3000|3001` | backend-specialist | high |
| `hydration|ssr|dom.*reconcil|customElements` | frontend-debugger-agent | high |

## Integration Points

### Frontend
```typescript
// app.html — inline pre-boot guard (DO NOT REMOVE)
<script>
  // Minimal error capture before React bundle loads
  // Installs window.__TNF_ERROR_AWARENESS_BOOT_GUARD__
</script>

// main.tsx — full module after React loads
import { installErrorAwareness } from './lib/errorAwareness';
installErrorAwareness();
```

### Backend (app.module.ts)
```typescript
import { ErrorAwarenessModule } from './modules/error-awareness/error-awareness.module';

@Module({
  imports: [
    // ... other modules
    ErrorAwarenessModule,
    // ...
  ],
})
export class AppModule {}
```

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `REDIS_URL` | - | Redis connection URL |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `REDIS_PASSWORD` | - | Redis password |
| `REDIS_ENABLED` | true | Toggle entire module |

## Testing

```bash
# Verify endpoint endpoint
curl -X POST https://api.thenewfuse.com/api/error-awareness/report \
  -H 'Content-Type: application/json' \
  -d '{"category":"console","severity":"error","message":"test probe","timestamp":"2026-08-12T14:00:00Z"}'

# Check recent errors
curl https://api.thenewfuse.com/api/error-awareness/recent

# Check stats
curl https://api.thenewfuse.com/api/error-awareness/stats
```

## Production Notes

1. Master Director consumes `tnf:master:tasks:realtime` continuously — error tasks are processed immediately
2. Deduplication window: 30 seconds (prevents task storms)
3. Ring buffer max: 500 entries
4. Endpoint accepts no-auth (rate-limited by global ThrottlerModule)