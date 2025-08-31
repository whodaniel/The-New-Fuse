# 🚀 TNF Browser Hub - Usage Guide

## 🎯 **Quick Start**

### **🌟 Option 1: Integrated Development (Recommended)**
```bash
# Starts everything: build check + all services + browser hub
bun run dev
```
**What it does:**
- ✅ Checks if build is needed (skips if already built)
- ✅ Starts API Gateway (port 3005)
- ✅ Starts Theia IDE (port 3007)
- ✅ Starts Backend API (port 3004)
- ✅ Starts Frontend App (port 3000)
- ✅ Launches Electron Browser Hub
- ✅ All services connect automatically!

### **Option 2: Services Only**
```bash
# Just start backend services (no browser)
bun run services:start
```

### **Option 3: Browser Only (Limited Functionality)**
```bash
# Just the browser interface
bun run hub:functional
```

## 🔧 **Troubleshooting Connection Issues**

### **Problem: Services Showing as Offline**
The console errors you're seeing are expected when services aren't running:

```
localhost:3005/v1/agents:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
localhost:3000/health:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**Solution:**
1. **Start the services first:**
   ```bash
   bun run services:start
   ```

2. **Wait for services to be ready** (you'll see):
   ```
   ✅ API Gateway ready at http://localhost:3005
   ✅ Theia IDE ready at http://localhost:3007
   ✅ Backend API ready at http://localhost:3004
   ```

3. **Then launch the browser:**
   ```bash
   bun run hub:functional
   ```

### **Problem: Blank Tabs**
If tabs are opening but showing blank content:

1. **Check if the service is running:**
   - Look at the service status in the toolbar
   - Green dots = online, Red dots = offline

2. **Wait for services to fully start:**
   - Services take 10-30 seconds to be ready
   - The browser will retry connections automatically

3. **Refresh the tab:**
   - Click the reload button in the address bar
   - Or use Ctrl+R

### **Problem: Security Warnings**
The Electron security warnings are normal in development:
```
Electron Security Warning (Disabled webSecurity)
Electron Security Warning (allowRunningInsecureContent)
```
These warnings:
- ✅ **Are expected** in development mode
- ✅ **Will not appear** in the packaged app
- ✅ **Don't affect functionality**

## 📊 **Service Status Guide**

### **Expected Service Ports:**
- **API Gateway**: `http://localhost:3005` - Main API endpoints
- **Theia IDE**: `http://localhost:3007` - Development environment
- **Backend API**: `http://localhost:3004` - Agent management
- **Frontend**: `http://localhost:3000` - Web dashboard (optional)

### **Health Check Responses:**
- **✅ Online**: Service responds to requests
- **⚠️ Warning**: Service starting or partial functionality
- **❌ Offline**: Service not running or unreachable

### **Service Dependencies:**
- **Theia IDE**: Independent, can run alone
- **API Gateway**: Needs Backend API for full functionality
- **Browser Hub**: Works standalone, enhanced with services

## 🎮 **Browser Hub Features**

### **Tab Management:**
- **New Tab**: Click `+` button or `Ctrl+T`
- **Close Tab**: Click `×` on tab or `Ctrl+W`
- **Switch Tabs**: Click on tab or use mouse wheel
- **Scroll Tabs**: When many tabs open, scroll horizontally

### **Navigation:**
- **Address Bar**: Type URLs or search terms
- **Back/Forward**: Use navigation buttons or browser shortcuts
- **Reload**: Click reload button or `Ctrl+R`
- **Zoom**: Use `Ctrl+` / `Ctrl+-` / `Ctrl+0`

### **Service Access:**
- **Click sidebar items** to open services in new tabs
- **Service status dots** show real-time availability
- **Collapsible sections** to reduce clutter

## 🚀 **Development Workflow**

### **Daily Development:**
```bash
# One command does everything!
bun run dev
```
**This will:**
- ✅ Check build status (skip rebuild if not needed)
- ✅ Start all backend services
- ✅ Launch the browser hub
- ✅ Connect everything automatically

### **First Time Setup:**
```bash
# 1. Build everything (includes Theia)
bun run build

# 2. Start services
bun run services:start

# 3. Launch browser
bun run hub:functional
```

### **Service Management:**
```bash
# Start services for browser
bun run services:start

# Check service health
curl http://localhost:3005/health
curl http://localhost:3007
curl http://localhost:3004/api/agents

# Stop services
# Press Ctrl+C in the services terminal
```

## 💡 **Tips & Tricks**

### **Performance:**
- **Keep services running** between browser sessions
- **Use smart dev** (`bun run dev`) to avoid rebuilds
- **Close unused tabs** to save memory

### **Debugging:**
- **Open DevTools**: `F12` or right-click → Inspect
- **Check service logs**: `tail -f /tmp/tnf-services.log`
- **Monitor network**: DevTools → Network tab

### **Keyboard Shortcuts:**
- `Ctrl+T` - New tab
- `Ctrl+W` - Close tab
- `Ctrl+R` - Reload
- `Ctrl++` - Zoom in
- `Ctrl+-` - Zoom out
- `Ctrl+0` - Reset zoom

## 🎯 **Expected Behavior**

### **When Services Are Running:**
- ✅ Tabs load content properly
- ✅ Service status shows green dots
- ✅ Dashboard shows real data
- ✅ All features functional

### **When Services Are Offline:**
- ⚠️ Tabs may show loading or error states
- ⚠️ Service status shows red dots
- ⚠️ Dashboard shows mock data
- ⚠️ Limited functionality

**The browser hub is designed to work in both modes - with graceful degradation when services are offline!** 🎉