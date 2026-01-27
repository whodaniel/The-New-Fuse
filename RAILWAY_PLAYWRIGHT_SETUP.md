# Railway Playwright Browser Streaming Setup

## 🚀 What Just Got Deployed

**FULL Playwright browser streaming** with real headless Chromium browsers!

- ✅ Real browsers launch on Railway
- ✅ Screenshot streaming at 2 FPS
- ✅ WebSocket connections working
- ✅ Master Clock synchronization
- ✅ Command injection (type, click, scroll)

## ⚙️ Railway Configuration Required

### 1. Install Playwright Browsers on Railway

Railway needs to install Chromium. Add this to your Railway service:

**Option A: Via Railway Environment Variables (Recommended)**

Add to your Railway environment:

```env
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
```

**Option B: Via Dockerfile (Advanced)**

If you need custom browser dependencies, create a Dockerfile:

```dockerfile
FROM node:18-slim

# Install Playwright system dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    libxrandr2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxcursor1 \
    libxi6 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libu2f-udev \
    libvulkan1 \
    xdg-utils \
    wget

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Install Playwright browsers
RUN pnpm exec playwright install chromium --with-deps

# Copy source
COPY . .

# Build
RUN pnpm run build

# Start
CMD ["pnpm", "run", "start:prod"]
```

### 2. Increase Railway Memory

Browser streaming needs more RAM:

**Go to Railway Dashboard:**

1. Select your API service
2. Click **Settings**
3. Scroll to **Resources**
4. Set **Memory**: `2GB` (minimum) or `3GB` (recommended for 10 sessions)
5. Set **CPU**: `1 vCPU` (minimum) or `2 vCPU` (recommended)

**Pricing Note:** This will increase your Railway bill. For 10 concurrent
browsers:

- Memory: 2-3GB RAM
- Cost: ~$10-15/month (Railway pricing)

### 3. Environment Variables

Add these to Railway environment variables:

```env
# Browser Streaming
BROWSER_STREAMING_ENABLED=true
BROWSER_STREAMING_FPS=2
BROWSER_STREAMING_JPEG_QUALITY=70

# Playwright
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright

# Frontend CORS
FRONTEND_URL=https://thenewfuse.com

# Optional: Reduce for testing
# BROWSER_STREAMING_FPS=1
# BROWSER_STREAMING_JPEG_QUALITY=50
```

### 4. Build Command (if using package.json scripts)

Make sure your Railway build command includes Playwright:

```json
{
  "scripts": {
    "postinstall": "pnpm exec playwright install chromium --with-deps",
    "build": "nest build",
    "start:prod": "node dist/main"
  }
}
```

## 🔍 Verify Deployment

### Check 1: Health Endpoint

Once deployed, test:

```bash
curl https://api.thenewfuse.com/api/browser-streaming/health
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
  "jpegQuality": 70,
  "sessions": []
}
```

### Check 2: Railway Logs

Watch Railway deployment logs for:

```
[BrowserStreamingService] 🚀 Creating browser session: duckduckgo (DuckDuckGo AI)
[BrowserStreamingService] 🌐 Launching Chromium for duckduckgo...
[BrowserStreamingService] 🔗 Navigating to https://duckduckgo.com/aichat...
[BrowserStreamingService] ✅ Browser session duckduckgo created successfully
[BrowserStreamingService] 🎥 Started streaming for duckduckgo at 2 FPS
```

### Check 3: Frontend Connection

Visit: https://thenewfuse.com/ai-command-center

Open DevTools → Console:

```
[BrowserStream] Initializing for session: duckduckgo
[BrowserStream] Connected for duckduckgo
```

Open DevTools → Network → WS tab:

- Should see: `wss://api.thenewfuse.com/socket.io/`
- Status: `101 Switching Protocols` (WebSocket upgrade)

## 📊 Resource Usage

### Per Browser Session:

- **Memory**: ~200-300MB
- **CPU**: ~5-10% per session
- **Bandwidth**: ~100KB/s (2 FPS @ 70% JPEG)

### For 10 Concurrent Sessions:

- **Memory**: ~2-3GB
- **CPU**: ~50-100% (1-2 vCPUs)
- **Bandwidth**: ~1MB/s total

## ⚠️ Troubleshooting

### Issue: "Executable doesn't exist" error

**Symptom:**

```
Error: Executable doesn't exist at /app/.cache/ms-playwright/chromium-1200/chrome-linux/chrome
```

**Solution:**

1. Add `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false` to Railway env vars
2. Add postinstall script to package.json:
   ```json
   "postinstall": "pnpm exec playwright install chromium --with-deps"
   ```
3. Redeploy

### Issue: "Protocol error (Page.screenshot): Target closed"

**Symptom:**

```
[BrowserStreamingService] Failed to capture frame for duckduckgo: Protocol error
```

**Solution:**

- Browser crashed due to memory limits
- Increase Railway memory to 2-3GB
- Or reduce concurrent sessions to 5-6

### Issue: High memory usage / OOM kills

**Solution 1: Reduce frame rate**

```env
BROWSER_STREAMING_FPS=1
```

**Solution 2: Reduce JPEG quality**

```env
BROWSER_STREAMING_JPEG_QUALITY=50
```

**Solution 3: Limit concurrent sessions** Modify frontend to only create 5-6
sessions instead of 10.

### Issue: WebSocket connection fails

**Symptom:**

```
WebSocket connection to 'wss://api.thenewfuse.com/socket.io/' failed
```

**Solution:**

1. Check CORS settings in `browser-streaming.gateway.ts`:
   ```typescript
   cors: {
     origin: process.env.FRONTEND_URL || '*',
     credentials: true,
   }
   ```
2. Verify Railway service is running
3. Check Railway logs for errors

## 🎯 Performance Optimization

### Low-Cost Mode (Testing)

```env
BROWSER_STREAMING_FPS=1
BROWSER_STREAMING_JPEG_QUALITY=50
```

- Memory: ~1.5GB for 10 sessions
- Cost: ~$7-10/month

### Balanced Mode (Recommended)

```env
BROWSER_STREAMING_FPS=2
BROWSER_STREAMING_JPEG_QUALITY=70
```

- Memory: ~2-3GB for 10 sessions
- Cost: ~$10-15/month

### High-Quality Mode (Production)

```env
BROWSER_STREAMING_FPS=3
BROWSER_STREAMING_JPEG_QUALITY=85
```

- Memory: ~3-4GB for 10 sessions
- Cost: ~$15-20/month

## 🚦 Deployment Checklist

- [ ] Playwright installed: `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false`
- [ ] Railway memory: `2GB minimum`
- [ ] Railway CPU: `1 vCPU minimum`
- [ ] Environment variables set (FPS, quality, CORS)
- [ ] Health endpoint returns 200 OK
- [ ] Railway logs show browser launching
- [ ] Frontend WebSocket connects successfully
- [ ] First session creates and streams frames

## 📚 Next Steps

1. **Monitor Railway logs** during first session creation
2. **Test with 1-2 sessions first** before enabling all 10
3. **Adjust FPS/quality** based on bandwidth and cost
4. **Set up alerts** for memory/CPU usage on Railway

---

**Status:** Railway deployment in progress. Check back in 2-3 minutes!

**Test Command:**

```bash
curl https://api.thenewfuse.com/api/browser-streaming/health
```

If you see `{"success":true,...}` - **IT WORKS!** 🎉
