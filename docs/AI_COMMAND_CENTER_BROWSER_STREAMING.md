# AI Command Center - Browser Streaming Edition

## Overview

The AI Command Center now uses **Browser-as-a-Service** streaming instead of
traditional iframes, completely avoiding X-Frame-Options blocking issues. This
implementation uses headless Playwright browsers running on your Railway
infrastructure to stream live browser sessions to your dashboard.

## 🎯 Key Features

### 1. **Headless Browser Streaming**

- Each AI endpoint runs in its own headless Chromium instance
- Real-time screenshot streaming at 2 FPS via WebSocket
- JPEG compression (70% quality) for efficient bandwidth usage
- Zero iframe restrictions - works with ANY website

### 2. **Master Clock Orchestrator**

- Broadcast the same query to all AI models simultaneously
- Perfect synchronization across all 10 active sessions
- Compare responses from multiple AIs in real-time
- Unified command injection system

### 3. **Visual Streaming**

- Canvas-based rendering bypasses all iframe restrictions
- Live FPS counter for each stream
- Status indicators (connecting, connected, error, disconnected)
- Automatic reconnection on network issues

### 4. **Session Management**

- Create/stop individual browser sessions
- Health monitoring for all sessions
- Memory-efficient frame compression
- Graceful cleanup on disconnect

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Dashboard                          │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ BrowserStreamCanvas│  │ BrowserStreamCanvas│  ...           │
│  │   (DuckDuckGo AI)  │  │   (HuggingChat)    │                │
│  └────────┬───────────┘  └────────┬───────────┘                │
│           │ WebSocket              │ WebSocket                  │
└───────────┼────────────────────────┼────────────────────────────┘
            │                        │
            └────────────┬───────────┘
                         │
┌────────────────────────┼────────────────────────────────────────┐
│         Backend API    │                                        │
│  ┌─────────────────────▼──────────────────────┐                │
│  │     BrowserStreamingGateway                │                │
│  │         (WebSocket Server)                 │                │
│  └─────────────────────┬──────────────────────┘                │
│                        │                                        │
│  ┌─────────────────────▼──────────────────────┐                │
│  │     BrowserStreamingService                │                │
│  │  ┌──────────────────────────────────────┐  │                │
│  │  │  Session 1: Chromium (DuckDuckGo)    │  │                │
│  │  │  - Screenshot every 500ms            │  │                │
│  │  │  - Command injection enabled         │  │                │
│  │  └──────────────────────────────────────┘  │                │
│  │  ┌──────────────────────────────────────┐  │                │
│  │  │  Session 2: Chromium (HuggingChat)   │  │                │
│  │  └──────────────────────────────────────┘  │                │
│  │  ...  (up to 10 concurrent sessions)       │                │
│  └─────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Installation

### 1. Install Dependencies

```bash
# Backend (Playwright)
cd apps/api
pnpm add playwright socket.io @nestjs/websockets @nestjs/platform-socket.io

# Install Playwright browsers
pnpm exec playwright install chromium

# Frontend (Socket.IO client)
cd apps/frontend
pnpm add socket.io-client
```

### 2. Environment Configuration

Add to `apps/api/.env`:

```env
# Browser Streaming
BROWSER_STREAMING_ENABLED=true
BROWSER_STREAMING_FPS=2
BROWSER_STREAMING_JPEG_QUALITY=70
```

Add to `apps/frontend/.env`:

```env
# Backend URL
VITE_BACKEND_URL=http://localhost:3001
```

### 3. Start Services

```bash
# Start backend API
pnpm --filter @the-new-fuse/api run dev

# Start frontend
pnpm --filter @the-new-fuse/frontend run dev
```

## 🚀 Usage

### Accessing the Command Center

Navigate to: `http://localhost:3000/ai-command-center-streaming`

Or update your router to use the streaming version by default.

### Master Clock Orchestrator

1. Click the **⚡ Master Clock** button in the header
2. Enter your query in the input field
3. Click **🚀 Broadcast** to send it to all AI sessions simultaneously
4. Watch all 10 AI models respond in real-time

### Keyboard Shortcuts

- `Ctrl+Shift+F` - Toggle Master Clock panel
- `Enter` - Submit broadcast message

## 🔧 API Reference

### REST Endpoints

#### Create Session

```http
POST /api/browser-streaming/sessions
Content-Type: application/json

{
  "id": "duckduckgo",
  "name": "DuckDuckGo AI",
  "url": "https://duckduckgo.com/aichat",
  "viewportWidth": 800,
  "viewportHeight": 600
}
```

#### Get All Sessions

```http
GET /api/browser-streaming/sessions
```

#### Execute Command

```http
POST /api/browser-streaming/sessions/:id/command
Content-Type: application/json

{
  "type": "type",
  "payload": {
    "selector": "textarea",
    "text": "Hello AI!"
  }
}
```

#### Broadcast to All

```http
POST /api/browser-streaming/broadcast
Content-Type: application/json

{
  "message": "Compare React vs Vue in 2026"
}
```

#### Stop Session

```http
DELETE /api/browser-streaming/sessions/:id
```

#### Health Check

```http
GET /api/browser-streaming/health
```

### WebSocket Events

#### Client → Server

**subscribe**: Subscribe to a session's stream

```typescript
socket.emit('subscribe', { sessionId: 'duckduckgo' });
```

**unsubscribe**: Unsubscribe from a session

```typescript
socket.emit('unsubscribe', { sessionId: 'duckduckgo' });
```

#### Server → Client

**frame**: New frame from browser session

```typescript
socket.on('frame', (data: StreamFrame) => {
  // data.sessionId, data.frame (base64), data.timestamp, data.width, data.height
});
```

**connected**: WebSocket connection established

```typescript
socket.on('connected', (data) => {
  console.log(data.message);
});
```

## 🎨 Component Usage

### BrowserStreamCanvas

```tsx
import { BrowserStreamCanvas } from '@/components/BrowserStreamCanvas';

<BrowserStreamCanvas
  sessionId="duckduckgo"
  name="DuckDuckGo AI"
  url="https://duckduckgo.com/aichat"
  width={800}
  height={600}
  onStatusChange={(status) => console.log('Status:', status)}
/>;
```

### useBrowserStreaming Hook

```tsx
import { useBrowserStreaming } from '@/hooks/useBrowserStreaming';

function MyComponent() {
  const {
    sessions,
    loading,
    createSession,
    stopSession,
    broadcast,
    getHealth,
  } = useBrowserStreaming();

  // Create a session
  await createSession('my-ai', 'My AI', 'https://example.com/chat');

  // Broadcast to all
  await broadcast('Hello all AIs!');

  // Stop a session
  await stopSession('my-ai');
}
```

## 🐛 Troubleshooting

### Issue: Frames not streaming

**Solution**: Check WebSocket connection in browser DevTools → Network → WS tab

### Issue: High memory usage

**Solution**: Reduce frame rate or JPEG quality in environment variables:

```env
BROWSER_STREAMING_FPS=1
BROWSER_STREAMING_JPEG_QUALITY=50
```

### Issue: Playwright browsers not installed

**Solution**: Run `pnpm exec playwright install chromium` in `apps/api`

### Issue: CORS errors

**Solution**: Update WebSocket CORS settings in `BrowserStreamingGateway`:

```typescript
cors: {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}
```

## 🚀 Railway Deployment

The browser streaming service is designed to run on Railway:

1. **Resource Requirements**:
   - Memory: 1GB per 3-4 active sessions
   - CPU: 0.5 vCPU per session
   - For 10 concurrent sessions: 2.5-3GB RAM, 2 vCPU

2. **Environment Variables**:

```env
BROWSER_STREAMING_ENABLED=true
BROWSER_STREAMING_FPS=2
BROWSER_STREAMING_JPEG_QUALITY=70
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
```

3. **Dockerfile** (if needed):

```dockerfile
FROM node:18-slim

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2

WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm exec playwright install chromium --with-deps

CMD ["pnpm", "run", "start:prod"]
```

## 📊 Performance Metrics

| Metric                        | Value                         |
| ----------------------------- | ----------------------------- |
| Frame Rate                    | 2 FPS (configurable)          |
| Frame Size                    | ~30-50KB per frame (JPEG 70%) |
| Bandwidth per Session         | ~100KB/s                      |
| Total Bandwidth (10 sessions) | ~1MB/s                        |
| Memory per Session            | ~200-300MB                    |
| Total Memory (10 sessions)    | ~2-3GB                        |
| Latency                       | <100ms local, <300ms Railway  |

## 🎯 Advantages Over Iframes

| Feature                | Iframes        | Browser Streaming   |
| ---------------------- | -------------- | ------------------- |
| X-Frame-Options Bypass | ❌ Blocked     | ✅ Works everywhere |
| Command Injection      | ❌ Limited     | ✅ Full control     |
| Synchronized Queries   | ❌ Impossible  | ✅ Master Clock     |
| Visual Consistency     | ❌ Varies      | ✅ Uniform canvas   |
| Network Isolation      | ❌ Client-side | ✅ Server-side      |
| Bot Detection Evasion  | ❌ Detectable  | ✅ Real browser     |

## 🔮 Future Enhancements

- [ ] Add video recording of sessions
- [ ] Implement session replays
- [ ] Add OCR for extracting AI responses as text
- [ ] Multi-user collaboration (shared sessions)
- [ ] Session history and analytics
- [ ] Custom viewport sizes per session
- [ ] Mobile browser emulation
- [ ] Network throttling simulation

## 📚 References

- [Playwright Documentation](https://playwright.dev/)
- [Socket.IO Documentation](https://socket.io/)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

**Note**: Since Phind shut down on January 16, 2026, it has been replaced with
Claude 4.5 in the endpoint list. The system now supports Claude Opus 4.5 and
Claude Sonnet 4.5 models.
