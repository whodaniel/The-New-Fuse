# 🔧 TNF Browser Hub - Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### **Issue 1: Tabs Show Placeholder Content**
**Problem:** Tabs load but show basic pages like "This page is working and ready for content"

**Root Cause:** The frontend service is running but not serving the full application

**Solutions:**
1. **Check if frontend is fully loaded:**
   ```bash
   curl http://localhost:3000
   curl http://localhost:3000/workflows
   ```

2. **Restart with full frontend:**
   ```bash
   # Stop current services (Ctrl+C)
   pnpm run dev:with-frontend
   ```

3. **Check frontend build status:**
   ```bash
   cd apps/frontend
   pnpm run build
   cd ../..
   pnpm run dev
   ```

### **Issue 2: Services Show as Online but Tabs Don't Load**
**Problem:** Service status shows green dots but content doesn't load in tabs

**Root Cause:** Services are starting but not fully ready

**Solutions:**
1. **Wait for full startup (30-60 seconds)**
2. **Check service logs:**
   ```bash
   tail -f /tmp/tnf-services.log
   ```
3. **Verify service endpoints:**
   ```bash
   curl http://localhost:3000/workflows
   curl http://localhost:3005/health
   curl http://localhost:3007
   ```

### **Issue 3: Connection Refused Errors**
**Problem:** `ERR_CONNECTION_REFUSED` in console

**Root Cause:** Services not started or ports blocked

**Solutions:**
1. **Start services first:**
   ```bash
   pnpm run dev
   ```
2. **Check port availability:**
   ```bash
   lsof -i :3000
   lsof -i :3005
   lsof -i :3007
   ```
3. **Clear ports and restart:**
   ```bash
   node scripts/clear-ports.js
   pnpm run dev
   ```

### **Issue 4: Blank or White Tabs**
**Problem:** Tabs open but show blank white content

**Root Cause:** iframe loading issues or CORS problems

**Solutions:**
1. **Check browser console** for specific errors
2. **Try reloading the tab** (reload button or Ctrl+R)
3. **Check if service is actually running:**
   ```bash
   curl -I http://localhost:3000/workflows
   ```
4. **Use direct service access:**
   - Open http://localhost:3000/workflows directly in browser
   - Compare with tab content

### **Issue 5: Services Start But Don't Connect**
**Problem:** `pnpm run dev` starts services but browser hub doesn't connect

**Root Cause:** Timing issues or service readiness

**Solutions:**
1. **Wait for services to be fully ready** (check logs)
2. **Refresh service status** (click refresh button)
3. **Check service health manually:**
   ```bash
   # API Gateway
   curl http://localhost:3005/health
   
   # Frontend
   curl http://localhost:3000
   
   # SkIDEancer
   curl http://localhost:3007
   
   # Backend
   curl http://localhost:3004/api/agents
   ```

### **Issue 6: Canvas Native Module Missing (canvas.node)**
**Problem:** Tests fail with "Cannot find module 'canvas.node'" or canvas package not working

**Root Cause:** Bun has compatibility issues with native modules like canvas, causing silent installation failures

**Symptoms:**
- `node_modules/canvas` directory missing after `pnpm install`
- Tests fail with canvas.node missing errors
- Canvas package appears in package.json but doesn't install

**Solution - Hybrid Package Manager Approach:**

1. **Switch to compatible Node.js version:**
   ```bash
   nvm use 18.20.5  # or any Node.js 18.x version
   ```

2. **Clean installation with script bypass:**
   ```bash
   rm -rf node_modules bun.lockb
   pnpm install --ignore-scripts
   ```

3. **Manually compile canvas native bindings:**
   ```bash
   cd node_modules/canvas
   node-gyp rebuild
   cd ../..
   ```

4. **Verify canvas is working:**
   ```bash
   # Test with Node.js
   node -e "const { createCanvas } = require('canvas'); console.log('Canvas loaded successfully!'); const canvas = createCanvas(200, 200); console.log('Canvas created successfully!');"
   
   # Test with Bun
   bun -e "const { createCanvas } = require('canvas'); console.log('Canvas loaded successfully with Bun!'); const canvas = createCanvas(200, 200); console.log('Canvas created successfully with Bun!');"
   ```

**Why This Works:**
- Bun's native module compilation has compatibility issues with certain packages
- Using `--ignore-scripts` allows package installation without problematic build scripts
- Manual compilation with `node-gyp` uses the more mature Node.js toolchain
- Once compiled, the native module works with both Node.js and Bun runtimes

**System Dependencies (macOS):**
If you encounter compilation errors, ensure you have the required system libraries:
```bash
# Install via Homebrew if needed
brew install cairo pango libpng jpeg giflib librsvg
```

**Alternative Approach:**
If the above doesn't work, you can use npm for installation and Bun for runtime:
```bash
# Temporarily change package manager
# Edit package.json: "packageManager": "npm@10.8.2"
npm install
# Change back: "packageManager": "bun@1.2.16"
pnpm test  # Use Bun for running tests
```

### **Issue 7: Chrome Extension Panel / Relay Disconnects (Port 3710)**
**Problem:** The extension panel is missing, or it stays in a disconnected state.

**Root Cause:** Content script not injected, saved panel state is invalid, or local WebSocket relay is down.

**Solutions:**
1. **Check extension APIs and panel injection:**
   ```javascript
   typeof chrome !== 'undefined' && chrome.runtime
   document.getElementById('tnf-floating-panel') !== null
   ```
2. **Reset panel position/state:**
   ```javascript
   localStorage.removeItem('tnf-panel-position');
   localStorage.removeItem('tnf-panel-state');
   ```
3. **Verify relay server and socket connection:**
   ```bash
   lsof -i :3710
   node launchWebSocketServer.js
   ```
   ```javascript
   const ws = new WebSocket('ws://localhost:3710');
   ws.onopen = () => console.log('connected');
   ```
4. **Check page limitations:** `chrome://` pages, sandboxed iframes, and strict CSP can block content scripts.
5. **Run extension validation script (if present):**
   ```bash
   ./test-chrome-extension-fixes.sh
   ```

## 🔍 **Diagnostic Commands**

### **Check Service Status**
```bash
# Quick service check
pnpm run check-build

# Manual port check
lsof -i :3000 :3005 :3007 :3004

# Service health check
curl -s http://localhost:3005/health | jq .
curl -s http://localhost:3000 | head -20
curl -s http://localhost:3007 | head -20
```

### **Check Native Module Installation**
```bash
# Check if canvas is installed
ls -la node_modules/canvas/

# Check if native bindings exist
ls -la node_modules/canvas/build/Release/

# Test canvas functionality
node -e "const { createCanvas } = require('canvas'); console.log('Canvas works!');"
bun -e "const { createCanvas } = require('canvas'); console.log('Canvas works with Bun!');"

# Check Node.js version compatibility
node --version  # Should be 18.x or 20.x for best native module support
```

### **Check Logs**
```bash
# Service logs (if using start-services script)
tail -f /tmp/tnf-services.log

# Individual service logs
cd apps/frontend && pnpm run dev
cd apps/api-gateway && pnpm run dev
cd apps/ide-ide && pnpm run dev
```

### **Network Debugging**
```bash
# Check what's listening on ports
netstat -tulpn | grep :300

# Test connectivity
telnet localhost 3000
telnet localhost 3005
telnet localhost 3007
```

## 🎯 **Step-by-Step Troubleshooting**

### **Step 1: Verify Build Status**
```bash
pnpm run check-build
```
**Expected:** All components should show as built

### **Step 2: Start Services Properly**
```bash
# Stop any existing services
pkill -f "turbo run dev"
pkill -f "node.*3000"

# Clear ports
node scripts/clear-ports.js

# Start fresh
pnpm run dev
```

### **Step 3: Wait for Full Startup**
**Wait 30-60 seconds** for all services to be ready

### **Step 4: Check Service Endpoints**
```bash
# These should all respond
curl http://localhost:3000
curl http://localhost:3005/health  
curl http://localhost:3007
curl http://localhost:3004/api/agents
```

### **Step 5: Test Browser Hub**
1. **Launch browser hub** (should happen automatically with `pnpm run dev`)
2. **Check service status** in toolbar (should show green dots)
3. **Try opening a service** (click sidebar item)
4. **Check for errors** in browser console (F12)

## 🚀 **Advanced Troubleshooting**

### **Frontend Service Issues**
```bash
# Check if frontend is built
ls -la apps/frontend/dist/

# Build frontend manually
cd apps/frontend
pnpm run build
pnpm run dev

# Check frontend routes
curl http://localhost:3000/workflows
curl http://localhost:3000/agents
curl http://localhost:3000/analytics
```

### **API Gateway Issues**
```bash
# Check API Gateway health
curl http://localhost:3005/health

# Check available routes
curl http://localhost:3005/v1/agents

# Check gateway logs
cd apps/api-gateway
pnpm run dev
```

### **SkIDEancer IDE Issues**
```bash
# Check SkIDEancer status
curl -I http://localhost:3007

# Check SkIDEancer build
ls -la apps/ide-ide/lib/

# Start SkIDEancer manually
cd apps/ide-ide
pnpm run dev
```

## 💡 **Pro Tips**

### **Development Workflow**
1. **Always use `pnpm run dev`** - it handles everything
2. **Wait for full startup** - don't rush to open tabs
3. **Check service status** before opening services
4. **Use browser console** to debug loading issues

### **Performance Tips**
1. **Keep services running** between sessions
2. **Use smart build** to avoid rebuilds
3. **Close unused tabs** to save memory
4. **Monitor service logs** for issues

### **Common Fixes**
1. **Restart everything:** `pkill -f turbo && pnpm run dev`
2. **Clear browser cache:** Hard refresh (Ctrl+Shift+R)
3. **Check firewall:** Ensure ports 3000-3008 are open
4. **Update dependencies:** `pnpm install` in root and service directories

## 🎉 **Expected Behavior**

### **When Everything Works:**
- ✅ `pnpm run dev` starts all services
- ✅ Browser hub launches automatically
- ✅ Service status shows green dots
- ✅ Tabs load full service interfaces
- ✅ No connection refused errors
- ✅ Smooth navigation between services

### **Startup Timeline:**
- **0-10s:** Build check and port clearing
- **10-30s:** Services starting up
- **30-60s:** Services fully ready
- **60s+:** Browser hub connects and works perfectly

**If you're still having issues after following this guide, the problem is likely in the service startup sequence or frontend build configuration.** 🔧

## 📚 **Additional Resources**

- **[Native Modules Guide](docs/NATIVE_MODULES_GUIDE.md)** - Comprehensive guide for handling native module compatibility issues with Bun
- **[Build Optimization](docs/BUILD_OPTIMIZATION.md)** - Memory-efficient build strategies and troubleshooting
- **[Development Setup](../GETTING_STARTED.md)** - Complete development environment setup guide
