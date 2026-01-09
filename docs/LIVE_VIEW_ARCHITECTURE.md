# AI Agent Live View Architecture

## Executive Summary

This document outlines the architecture for a multi-tenant AI Agent Live View
system that enables real-time monitoring of AI agent browser activity across
**thenewfuse.com**. The system will allow users to watch what AI agents are
doing online in real-time through a dedicated subdomain.

## Goals

1. **Real-time Visibility**: Users can see live screenshots of what AI agents
   are doing in browsers
2. **Multi-tenant Support**: Each tenant can view their own agents' activity
3. **Subdomain Routing**: Use `live.thenewfuse.com` or `agents.thenewfuse.com`
   as the viewer portal
4. **Scalable Architecture**: Support hundreds of concurrent viewers and agents
5. **Production-Ready**: Work reliably with Railway's infrastructure

---

## Current Issues & Solutions

### Problem: Railway WebSocket Proxy Issues

**Symptoms:**

- Native WebSocket connections fail with "Invalid frame header" error from
  browsers
- Node.js WebSocket clients work, but browser clients fail
- The Railway edge proxy may be modifying WebSocket frames

**Solutions (in order of recommendation):**

### Solution 1: Use Soketi (Recommended for Production)

**Soketi** is a self-hosted, open-source WebSocket server that implements the
Pusher Protocol v7. Railway offers one-click deployment templates for Soketi.

**Benefits:**

- Battle-tested WebSocket infrastructure
- Native Railway support with deployment templates
- Pusher protocol compatibility (wide library support)
- Designed for horizontal scaling
- Free (self-hosted) vs per-message pricing

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                   thenewfuse.com                        │
├─────────────────────────────────────────────────────────┤
│  live.thenewfuse.com  →  Soketi WebSocket Server       │
│  agents.thenewfuse.com →  Cloud Sandbox Service        │
│  www.thenewfuse.com   →  Frontend Application          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Railway Services                     │
├─────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │   Soketi   │  │ Cloud Sandbox  │  │   Frontend   │  │
│  │  WebSocket │◄─┤  (Playwright)  │  │    (Vite)    │  │
│  │   Server   │  │                │  │              │  │
│  └─────▲──────┘  └────────────────┘  └──────────────┘  │
│        │                                                │
│        │ Private Network (Wireguard)                   │
│        │                                                │
│  ┌─────┴──────┐                                        │
│  │   Redis    │  (Optional: for scaling)               │
│  └────────────┘                                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │          Browser Clients            │
         │  (Viewers watching agent activity)  │
         └─────────────────────────────────────┘
```

**Implementation Steps:**

1. Deploy Soketi on Railway using template: https://railway.app/template/soketi
2. Configure Soketi environment variables
3. Update Cloud Sandbox to publish screenshot events to Soketi
4. Create viewer page that subscribes to Soketi channels
5. Set up `live.thenewfuse.com` subdomain pointing to Soketi

### Solution 2: Socket.IO with Transports Fallback

If staying with custom WebSocket implementation, use Socket.IO which handles
proxy issues gracefully.

**Benefits:**

- Automatic fallback to long-polling if WebSocket fails
- Built-in reconnection logic
- Well-documented Railway compatibility
- Namespace support for multi-tenancy

**Code Changes Required:**

```typescript
// Server side (cloud-sandbox/src/server.ts)
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: {
    origin: ['https://thenewfuse.com', 'https://live.thenewfuse.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Fallback to polling
  path: '/socket.io/',
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register_monitor', (data) => {
    socket.join(`tenant:${data.tenantId}`);
    socket.emit('welcome', { message: 'Connected to Live View' });
  });
});

// Broadcast screenshot to tenant's viewers
function broadcastScreenshot(tenantId: string, screenshot: string) {
  io.to(`tenant:${tenantId}`).emit('screenshot', { image: screenshot });
}
```

```typescript
// Client side (viewer)
import { io } from 'socket.io-client';

const socket = io('https://tnf-cloud-sandbox-v2-production.up.railway.app', {
  transports: ['websocket', 'polling'],
  path: '/socket.io/',
});

socket.on('connect', () => {
  socket.emit('register_monitor', { tenantId: 'user-123' });
});

socket.on('screenshot', (data) => {
  document.getElementById('browser-view').src = data.image;
});
```

### Solution 3: HTTP Polling Fallback (Simplest)

For immediate reliability without infrastructure changes:

```typescript
// Periodic polling endpoint
app.get('/api/latest-screenshot', (req, res) => {
  const tenantId = req.query.tenantId;
  const screenshot = latestScreenshots.get(tenantId);
  res.json({
    screenshot,
    timestamp: Date.now(),
    agentStatus: 'active',
  });
});

// Client polls every 500ms
setInterval(async () => {
  const res = await fetch('/api/latest-screenshot?tenantId=123');
  const data = await res.json();
  if (data.screenshot) {
    document.getElementById('browser-view').src = data.screenshot;
  }
}, 500);
```

---

## Multi-Tenant Architecture

### Subdomain Routing Strategy

| Subdomain             | Purpose            | Service                  |
| --------------------- | ------------------ | ------------------------ |
| `www.thenewfuse.com`  | Main application   | Frontend                 |
| `app.thenewfuse.com`  | Dashboard          | Frontend (auth required) |
| `live.thenewfuse.com` | Live View portal   | Cloud Sandbox / Soketi   |
| `api.thenewfuse.com`  | REST API           | API Service              |
| `ws.thenewfuse.com`   | WebSocket endpoint | Soketi / Socket.IO       |

### Tenant Isolation

Each tenant's AI agents broadcast to tenant-specific channels:

```
channels:
  - tenant:tenant-123:screenshots    # Screenshot updates
  - tenant:tenant-123:activity       # Activity logs
  - tenant:tenant-123:health         # Agent health status
```

### Authentication Flow

```
1. User logs into thenewfuse.com
2. JWT token issued with tenant_id claim
3. User navigates to live.thenewfuse.com
4. JWT verified, tenant_id extracted
5. User subscribed to their tenant's channels only
```

---

## Recommended Implementation Plan

### Phase 1: Immediate Fix (1-2 days)

1. **Deploy Soketi on Railway**

   ```bash
   # Use Railway template
   railway init soketi-websocket
   # Or deploy from: https://railway.app/template/soketi
   ```

2. **Configure Soketi Environment Variables**

   ```env
   SOKETI_DEFAULT_APP_ID=fuse-live-view
   SOKETI_DEFAULT_APP_KEY=your-app-key
   SOKETI_DEFAULT_APP_SECRET=your-app-secret
   SOKETI_DEBUG=true
   PORT=6001
   ```

3. **Update Cloud Sandbox to Publish to Soketi**

   ```typescript
   import Pusher from 'pusher';

   const pusher = new Pusher({
     appId: process.env.SOKETI_APP_ID,
     key: process.env.SOKETI_APP_KEY,
     secret: process.env.SOKETI_APP_SECRET,
     host: 'soketi-service.railway.internal', // Private networking
     port: '6001',
     useTLS: false, // Internal connection
   });

   // After each browser action
   function broadcastScreenshot(
     tenantId: string,
     screenshot: string,
     action: string
   ) {
     pusher.trigger(`tenant-${tenantId}`, 'screenshot', {
       image: screenshot,
       action,
       timestamp: Date.now(),
     });
   }
   ```

4. **Create Viewer Client**

   ```typescript
   import Pusher from 'pusher-js';

   const pusher = new Pusher('your-app-key', {
     wsHost: 'live.thenewfuse.com',
     wsPort: 443,
     forceTLS: true,
     disableStats: true,
     enabledTransports: ['ws', 'wss'],
   });

   const channel = pusher.subscribe(`tenant-${tenantId}`);
   channel.bind('screenshot', (data) => {
     document.getElementById('browser-view').src = data.image;
   });
   ```

### Phase 2: Multi-Tenant Integration (3-5 days)

1. Add tenant context to all agent operations
2. Implement JWT authentication for Live View
3. Create tenant-specific dashboard views
4. Add activity logging and history

### Phase 3: Production Hardening (1 week)

1. Set up Redis for Soketi horizontal scaling
2. Implement rate limiting
3. Add monitoring and alerting (Prometheus/Grafana)
4. Create backup polling mechanism

---

## DNS Configuration

Add the following records to your Cloudflare/DNS provider for thenewfuse.com:

```
# Subdomain pointing to Railway services
live    CNAME   soketi-service-production.up.railway.app
ws      CNAME   soketi-service-production.up.railway.app
agents  CNAME   tnf-cloud-sandbox-v2-production.up.railway.app
```

**Important Cloudflare Settings:**

- **Disable** the orange cloud proxy (use DNS only mode)
- Railway handles SSL termination and routing
- Double-proxying causes WebSocket issues

---

## Security Considerations

1. **Authentication**: All WebSocket connections must authenticate
2. **Channel Authorization**: Tenant can only subscribe to their channels
3. **Rate Limiting**: Limit screenshots per minute per agent
4. **Data Encryption**: All connections over TLS/WSS
5. **Token Expiration**: Short-lived tokens for Live View access

---

## Monitoring & Observability

### Key Metrics to Track

- WebSocket connection count per tenant
- Screenshot broadcast latency
- Agent activity events per minute
- Connection error rates
- Viewer session duration

### Logging

```typescript
// Structured logging for observability
logger.info('screenshot_broadcast', {
  tenantId,
  agentId,
  action: 'navigate',
  url: page.url(),
  latencyMs: Date.now() - startTime,
});
```

---

## Cost Considerations

| Option               | Monthly Cost (est.)       | Notes                         |
| -------------------- | ------------------------- | ----------------------------- |
| Soketi (self-hosted) | $5-20 (Railway resources) | Most cost-effective           |
| Pusher               | $49-199+                  | Based on connections/messages |
| Ably                 | $29-99+                   | Enterprise features           |
| Custom WebSocket     | $5-20 (Railway resources) | Requires maintenance          |

**Recommendation**: Start with self-hosted Soketi for cost efficiency and full
control.

---

## Next Steps

1. [ ] Deploy Soketi on Railway
2. [ ] Configure DNS for `live.thenewfuse.com`
3. [ ] Update Cloud Sandbox to use Pusher client for broadcasting
4. [ ] Create authenticated Live View page in frontend
5. [ ] Test multi-tenant isolation
6. [ ] Deploy to production

---

## References

- [Railway WebSocket Documentation](https://docs.railway.app)
- [Soketi GitHub](https://github.com/soketi/soketi)
- [Pusher Protocol Specification](https://pusher.com/docs/channels/library_auth_reference/pusher-websockets-protocol/)
- [Socket.IO Railway Deployment](https://railway.app/template/socketio)
