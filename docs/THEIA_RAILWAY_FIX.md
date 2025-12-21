# Theia IDE Railway Deployment - Diagnosis & Fix

**Issue Date**: December 20, 2025  
**Status**: Container Online, UI Not Loading  
**Error**: "Cannot GET /" at https://ide.thenewfuse.com

---

## 🔍 DIAGNOSIS

### Current Configuration (Railway Dashboard)

- ✅ Service: **Online** (healthcheck passing)
- 🌐 Domains: `ide.thenewfuse.com`, `skideancer.thenewfuse.com`
- ⚠️ **Port**: 3000 (configured in Railway)
- 📦 Repository: `whodaniel/fuse-theia-ide`

### Expected Configuration (Per THEIA_ISOLATION_STRATEGY.md)

- 🎯 Port: **3007** (Theia default)
- 📝 Start command:
  `node src-gen/backend/server.js --hostname=0.0.0.0 --port=3007`
- 🐳 Dockerfile: Should expose port 3007

### Error Analysis

```
HTTP/2 404
server: railway-edge
x-powered-by: Express
```

**Meaning**:

- ✅ Container is running (Express is responding)
- ❌ Theia IDE is not serving on the configured port
- ⚠️ Port mismatch: Railway expects 3000, Theia listens on 3007

---

## 🛠️ SOLUTION

### Option 1: Update Railway Port (Recommended)

Change Railway's public networking port from 3000 to 3007:

1. Go to Railway project:
   https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1/service/c83fc5bd-af38-4fd2-847f-260a2fc69f0c
2. Navigate to **Settings** → **Networking**
3. Update port mapping:
   - Current: `ide.thenewfuse.com → 3000`
   - New: `ide.thenewfuse.com → 3007`
4. Click **Update**
5. Wait 30 seconds for routing to update

### Option 2: Update Theia Start Command

If you prefer to keep port 3000, update the Theia service:

**In Railway Service Settings**:

- **Start Command**:
  `node src-gen/backend/server.js --hostname=0.0.0.0 --port=3000`

**OR in Dockerfile**:

```dockerfile
CMD ["node", "src-gen/backend/server.js", "--hostname=0.0.0.0", "--port=3000"]
```

### Option 3: Use Railway's $PORT Variable (Best Practice)

Let Railway dynamically assign the port:

**Update Start Command**:

```bash
node src-gen/backend/server.js --hostname=0.0.0.0 --port=$PORT
```

**In package.json**:

```json
{
  "scripts": {
    "start": "node src-gen/backend/server.js --hostname=0.0.0.0 --port=${PORT:-3007}"
  }
}
```

---

## ✅ VERIFICATION STEPS

After making changes:

1. **Check Service Logs**

   ```bash
   # Should see:
   Theia IDE v2.0.0 started successfully
   Theia app listening on: 0.0.0.0:3007
   ```

2. **Test Endpoint**

   ```bash
   curl -I https://ide.thenewfuse.com
   # Should return HTTP 200, not 404
   ```

3. **Access UI**
   - Open: https://ide.thenewfuse.com
   - Should load Theia IDE interface
   - No "Cannot GET /" error

---

## 🔧 ADDITIONAL CHECKS

### Check Environment Variables

Ensure these are set in Railway:

```bash
NODE_ENV=production
THEIA_WEBVIEW_EXTERNAL_ENDPOINT={{RAILWAY_STATIC_URL}}
CLOUD_SANDBOX_URL=https://tnf-cloud-sandbox-production.up.railway.app
```

### Check Healthcheck

Current healthcheck path: `/healthz`

**Issue**: Theia doesn't have this endpoint by default

**Fix**: Change healthcheck to:

- Path: `/` (root)
- Or remove healthcheck entirely
- Or add custom healthcheck endpoint to Theia

### Check Logs for Errors

Look for:

- ❌ "Port already in use"
- ❌ "EADDRINUSE"
- ❌ "Connection refused"
- ✅ "Theia app listening on..."

---

## 🎯 RECOMMENDED ACTION

**Immediate Fix** (2 minutes):

1. Go to Railway dashboard
2. Update public networking port: `3000` → `3007`
3. Click **Update**
4. Wait 30 seconds
5. Refresh https://ide.thenewfuse.com

**Long-term Fix** (5 minutes):

1. Update Dockerfile to use `$PORT` environment variable
2. Redeploy service
3. Let Railway auto-configure the port

---

## 📊 PORT CONFIGURATION REFERENCE

| Service            | Default Port | Railway Port | Status       |
| ------------------ | ------------ | ------------ | ------------ |
| Theia (Documented) | 3007         | 3000 ❌      | **Mismatch** |
| Cloud Sandbox      | Auto         | Auto ✅      | Working      |
| TNF Relay          | 3000         | N/A          | Local only   |

---

## 🚨 WHY THIS HAPPENED

The Railway dashboard shows "Online" because:

1. ✅ Container starts successfully
2. ✅ Healthcheck passes (if using `/healthz` on a different port)
3. ✅ Express server is running

But the IDE doesn't load because:

1. ❌ Theia listens on port 3007
2. ❌ Railway routes traffic to port 3000
3. ❌ No service on port 3000 to handle requests
4. Result: **404 Cannot GET /**

---

## 📝 NEXT STEPS

1. **Update Railway port configuration** (Option 1 above)
2. **Test the subdomain**: https://ide.thenewfuse.com
3. **If still broken**: Check deployment logs in Railway dashboard
4. **If working**: Add Theia link to Tauri UI and Website

---

**Expected Result**: Theia IDE loads successfully with full AI integrations
enabled.
