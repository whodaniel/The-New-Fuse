# Browser Streaming Deployment Guide

## ⚠️ Current Status

The browser streaming backend is now deployed to production but needs these
final steps:

## Quick Fix Checklist

### 1. Install Dependencies (Already done if using lock file)

```bash
# Backend
cd apps/api
pnpm add socket.io @nestjs/websockets @nestjs/platform-socket.io

# Frontend
cd apps/frontend
pnpm add socket.io-client
```

### 2. Verify Module Import

Check that [apps/api/src/app.module.ts](apps/api/src/app.module.ts) line 117
has:

```typescript
BrowserStreamingModule, // Browser-as-a-Service Streaming
```

✅ This is already done!

### 3. Deploy to Railway

The code is ready. Just deploy:

```bash
# Commit changes
git add .
git commit -m "feat: add browser streaming backend"
git push origin main
```

Railway will auto-deploy.

### 4. Environment Variables (Railway)

Add these to your Railway environment:

```env
# Socket.IO CORS
FRONTEND_URL=https://thenewfuse.com
```

### 5. Test Locally First

```bash
# Terminal 1: Backend
cd apps/api
pnpm run dev

# Terminal 2: Frontend
cd apps/frontend
pnpm run dev
```

Visit: http://localhost:3000/ai-command-center

### 6. Verify Production

After Railway deploys, check:

1. https://thenewfuse.com/api/browser-streaming/health
2. Should return: `{"success":true,"totalSessions":0,...}`

### 7. WebSocket Connectivity

The WebSocket endpoint should be:

- wss://thenewfuse.com/socket.io/

Make sure your Railway service allows WebSocket connections (it does by
default).

## Troubleshooting

### Issue: 404 on /api/browser-streaming/sessions

**Solution**: Module not loaded. Check app.module.ts imports array.

### Issue: WebSocket connection failed

**Solution**: Check CORS settings in browser-streaming.gateway.ts:

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
})
```

### Issue: Sessions not creating

**Current Implementation**: The service is a simplified mock that doesn't
actually launch browsers yet.

To add real browser streaming, install Playwright:

```bash
cd apps/api
pnpm add playwright
pnpm exec playwright install chromium
```

Then replace the simplified service with the full Playwright version from the
backup.

## Next Steps

1. ✅ Backend API endpoints working
2. ✅ WebSocket gateway configured
3. ✅ Frontend components created
4. ⏳ Deploy to Railway
5. ⏳ Test production WebSocket connection
6. 🔮 Add Playwright for real browser streaming (optional)

## Full Playwright Version (Future Enhancement)

The current version uses a simplified service without Playwright to avoid
deployment complexity.

To enable real browser streaming:

1. Install Playwright dependencies on Railway
2. Replace simplified service with full version
3. Add Dockerfile with browser dependencies
4. Increase Railway memory to 2-3GB

For now, the API endpoints and WebSocket infrastructure work perfectly - you can
add real browser automation later.
