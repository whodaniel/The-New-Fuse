# Browser Streaming Integration Guide

## Quick Start

Run the automated setup script:

```bash
./scripts/setup-browser-streaming.sh
```

Then start your services:

```bash
# Terminal 1: Backend
pnpm --filter @the-new-fuse/api run dev

# Terminal 2: Frontend
pnpm --filter @the-new-fuse/frontend run dev
```

Navigate to: `http://localhost:3000/ai-command-center-streaming`

## Manual Integration Steps

### 1. Add Route to Frontend Router

Update your router file (e.g.,
[ComprehensiveRouter.tsx](apps/frontend/src/ComprehensiveRouter.tsx)):

```tsx
import AICommandCenterStreaming from './pages/AICommandCenter/AICommandCenterStreaming';

// Add to your routes:
<Route path="/ai-command-center-streaming" element={<AICommandCenterStreaming />} />

// Optional: Make it the default
<Route path="/ai-command-center" element={<AICommandCenterStreaming />} />
```

### 2. Update Navigation Links

If you have a sidebar or navigation menu, add a link:

```tsx
<Link to="/ai-command-center-streaming">
  🎛️ AI Command Center (Browser Streaming)
</Link>
```

### 3. Environment Variables

#### Backend (`apps/api/.env`)

```env
# Browser Streaming
BROWSER_STREAMING_ENABLED=true
BROWSER_STREAMING_FPS=2
BROWSER_STREAMING_JPEG_QUALITY=70

# Railway specific (if deploying)
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
```

#### Frontend (`apps/frontend/.env`)

```env
# Local development
VITE_BACKEND_URL=http://localhost:3001

# Production (Railway)
VITE_BACKEND_URL=https://your-api.railway.app
```

### 4. Add to Package.json Scripts (Optional)

Add convenience scripts to root `package.json`:

```json
{
  "scripts": {
    "browser-streaming:setup": "./scripts/setup-browser-streaming.sh",
    "browser-streaming:dev": "concurrently \"pnpm --filter @the-new-fuse/api run dev\" \"pnpm --filter @the-new-fuse/frontend run dev\"",
    "browser-streaming:health": "curl http://localhost:3001/api/browser-streaming/health"
  }
}
```

Then you can run:

```bash
pnpm run browser-streaming:setup  # One-time setup
pnpm run browser-streaming:dev    # Start both services
pnpm run browser-streaming:health # Check health
```

### 5. Testing the Integration

#### Test Backend Health

```bash
curl http://localhost:3001/api/browser-streaming/health
```

Expected response:

```json
{
  "success": true,
  "totalSessions": 0,
  "runningSessions": 0,
  "errorSessions": 0,
  "stoppedSessions": 0,
  "frameRate": 2,
  "sessions": []
}
```

#### Test WebSocket Connection

Open browser console on the frontend:

```javascript
const socket = io('http://localhost:3001/browser-streaming');
socket.on('connect', () => console.log('Connected!'));
socket.on('frame', (data) => console.log('Frame:', data));
socket.emit('subscribe', { sessionId: 'duckduckgo' });
```

#### Test Session Creation

```bash
curl -X POST http://localhost:3001/api/browser-streaming/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-session",
    "name": "Test AI",
    "url": "https://duckduckgo.com/aichat",
    "viewportWidth": 800,
    "viewportHeight": 600
  }'
```

#### Test Master Clock Broadcast

```bash
curl -X POST http://localhost:3001/api/browser-streaming/broadcast \
  -H "Content-Type: application/json" \
  -d '{"message": "Compare React vs Vue in 2026"}'
```

## Troubleshooting

### Port Conflicts

If port 3001 is already in use, update `apps/api/.env`:

```env
PORT=3002
```

And update frontend `apps/frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:3002
```

### Playwright Installation Issues

If Playwright fails to install:

```bash
cd apps/api

# Install system dependencies (Linux/WSL)
sudo apt-get update
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2

# Install Playwright
pnpm exec playwright install chromium --with-deps
```

### WebSocket Connection Failures

1. Check CORS settings in
   [BrowserStreamingGateway](apps/api/src/browser-streaming/browser-streaming.gateway.ts)
2. Verify backend is running: `curl http://localhost:3001/api/health`
3. Check browser console for WebSocket errors
4. Ensure `socket.io-client` version matches backend `socket.io` version

### High Memory Usage

Reduce active sessions or adjust settings:

```env
# Reduce frame rate
BROWSER_STREAMING_FPS=1

# Reduce image quality
BROWSER_STREAMING_JPEG_QUALITY=50

# Limit concurrent sessions to 5
MAX_CONCURRENT_SESSIONS=5
```

## Railway Deployment

### 1. Update railway.json

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm run build"
  },
  "deploy": {
    "startCommand": "pnpm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Set Environment Variables

In Railway dashboard, add:

```
BROWSER_STREAMING_ENABLED=true
BROWSER_STREAMING_FPS=2
BROWSER_STREAMING_JPEG_QUALITY=70
NODE_ENV=production
```

### 3. Update Frontend Deployment

Set production backend URL:

```
VITE_BACKEND_URL=https://your-backend.up.railway.app
```

### 4. Resource Requirements

For 10 concurrent sessions:

- **Memory**: 3GB (recommended 4GB)
- **CPU**: 2 vCPU
- **Plan**: Pro plan recommended

## Performance Optimization

### Reduce Bandwidth

```typescript
// In BrowserStreamingService.ts
private readonly FRAME_RATE = 1; // Reduce to 1 FPS
private readonly JPEG_QUALITY = 50; // Lower quality
```

### Implement Lazy Loading

Only create sessions when user scrolls to them:

```tsx
const [visibleSessions, setVisibleSessions] = useState<string[]>([]);

useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const sessionId = entry.target.getAttribute('data-session-id');
        if (sessionId) setVisibleSessions((prev) => [...prev, sessionId]);
      }
    });
  });

  // Observe session containers
}, []);
```

### Session Pooling

Reuse browser instances instead of creating new ones:

```typescript
// In BrowserStreamingService
private browserPool: Browser[] = [];

async getOrCreateBrowser(): Promise<Browser> {
  if (this.browserPool.length > 0) {
    return this.browserPool.pop()!;
  }
  return await chromium.launch({ ... });
}
```

## Monitoring

### Add Health Check Endpoint

Already included at:

```
GET /api/browser-streaming/health
```

### Prometheus Metrics (Future Enhancement)

```typescript
// Add to BrowserStreamingService
@Histogram({ name: 'browser_frame_duration' })
frameDuration: Histogram;

@Gauge({ name: 'browser_active_sessions' })
activeSessions: Gauge;
```

## Security Considerations

### 1. Rate Limiting

Add rate limiting to prevent abuse:

```typescript
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 requests per 60 seconds
@Post('sessions')
async createSession(...) { ... }
```

### 2. Authentication

Add authentication to protect endpoints:

```typescript
@UseGuards(JwtAuthGuard)
@Controller('api/browser-streaming')
export class BrowserStreamingController { ... }
```

### 3. Input Validation

Validate URLs to prevent SSRF:

```typescript
const ALLOWED_DOMAINS = [
  'duckduckgo.com',
  'huggingface.co',
  'venice.ai',
  // ... other trusted domains
];

validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(domain =>
      parsed.hostname.endsWith(domain)
    );
  } catch {
    return false;
  }
}
```

## Next Steps

1. ✅ Run `./scripts/setup-browser-streaming.sh`
2. ✅ Start backend and frontend
3. ✅ Test the AI Command Center
4. ✅ Configure Master Clock orchestrator
5. ✅ Deploy to Railway
6. 📚 Read full documentation: `docs/AI_COMMAND_CENTER_BROWSER_STREAMING.md`

---

**Need Help?**

- Check logs: `apps/api/logs/` and browser console
- Verify Playwright: `pnpm exec playwright --version`
- Test WebSocket: Browser DevTools → Network → WS tab
