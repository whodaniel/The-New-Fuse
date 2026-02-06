# 🔧 Chrome Extension Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Issue 1: "chrome is not defined" Error

**Symptoms:**

- Console errors in content script
- Extension panel not showing
- Chrome API failures

**Solution:** ✅ Fixed in latest code - The content script now includes Chrome
API availability detection and fallback mechanisms.

**Manual Check:**

```javascript
// In browser console
typeof chrome !== 'undefined' && chrome.runtime;
```

### Issue 2: WebSocket Server Won't Start

**Symptoms:**

- "Start Server" button doesn't work
- Connection timeouts
- Port already in use errors

**Solutions:**

**A. Check Port Availability:**

```bash
# Check if port 3710 is in use
lsof -i :3710
netstat -tlnp | grep 3710

# Kill existing process if needed
sudo pkill -f "3710"
```

**B. Manual Server Start:**

```bash
# Start server directly
node launchWebSocketServer.js

# Or test the base server
node test-websocket-server-3710.cjs
```

**C. Try Different Port:**

```bash
# Start on different port
node launchWebSocketServer.js 3711

# Update extension URL to ws://localhost:3711
```

### Issue 3: Extension Panel Not Showing

**Symptoms:**

- Keyboard shortcut (Ctrl+Shift+F) not working
- Panel invisible or off-screen

**Solutions:**

**A. Reset Panel Position:**

```javascript
// In browser console
localStorage.removeItem('tnf-panel-position');
localStorage.removeItem('tnf-panel-state');
```

**B. Force Show Panel:**

```javascript
// In browser console
window.postMessage({ type: 'TNF_SHOW_PANEL' }, '*');
```

**C. Check Extension Load:**

```
Chrome → Extensions → Developer mode → Check if extension is loaded and enabled
```

### Issue 4: WebSocket Connection Fails

**Symptoms:**

- "Disconnected" status in panel
- No chat relay functionality
- Connection timeout errors

**Solutions:**

**A. Verify Server Status:**

```bash
# Check if server is actually running
curl -i -N \
     -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:3710/
```

**B. Test WebSocket Connection:**

```javascript
// In browser console
const ws = new WebSocket('ws://localhost:3710');
ws.onopen = () => console.log('✅ Connected');
ws.onerror = (error) => console.log('❌ Error:', error);
```

**C. Check Browser Permissions:**

- Mixed content blocking (HTTPS/HTTP)
- CORS policies
- WebSocket protocol support

### Issue 5: Element Selection Not Working

**Symptoms:**

- "Auto-Detect" button doesn't work
- Manual selection mode fails
- No element highlighting

**Solutions:**

**A. Check Page Context:**

```javascript
// Verify content script is loaded
document.getElementById('tnf-floating-panel') !== null;
```

**B. Page Compatibility:**

- Some pages block content scripts (chrome:// pages)
- iframes may isolate context
- Security policies may prevent element access

**C. Reset Element Detection:**

```javascript
// In browser console
window.postMessage({ type: 'TNF_RESET_ELEMENTS' }, '*');
```

### Issue 6: Dependencies Missing

**Symptoms:**

- Module not found errors
- Package import failures
- npm/yarn errors

**Solutions:**

**A. Install WebSocket Package:**

```bash
pnpm install ws
# or
pnpm install ws
```

**B. Check Node.js Version:**

```bash
node --version
# Requires Node.js 16+ for proper WebSocket support
```

**C. Clear Package Cache:**

```bash
pnpm store prune --force
rm -rf node_modules
pnpm install
```

## 🛠 Debug Commands

### Test WebSocket Server:

```bash
# Run validation script
chmod +x test-chrome-extension-fixes.sh
./test-chrome-extension-fixes.sh
```

### Chrome Extension Debugging:

```
1. Chrome → Extensions → Developer mode → Inspect views: background page
2. Chrome → Developer Tools → Console (check for errors)
3. Chrome → Developer Tools → Network (check WebSocket connections)
```

### Manual Testing Steps:

```
1. Load extension: Chrome → Extensions → Load unpacked → Select chrome-extension/
2. Start server: node launchWebSocketServer.js
3. Open any webpage
4. Press Ctrl+Shift+F to show panel
5. Click "Connect" button
6. Test chat relay functionality
```

## 📊 Health Check Script

Use this JavaScript snippet in browser console to diagnose issues:

```javascript
// The New Fuse Health Check
console.log('🔍 The New Fuse Health Check');
console.log('===========================');

// Check Chrome APIs
console.log(
  'Chrome APIs:',
  typeof chrome !== 'undefined' ? '✅ Available' : '❌ Unavailable'
);

// Check Extension
const panel = document.getElementById('tnf-floating-panel');
console.log('Extension Panel:', panel ? '✅ Loaded' : '❌ Not Found');

// Test WebSocket
const ws = new WebSocket('ws://localhost:3710');
ws.onopen = () => console.log('WebSocket:', '✅ Connected');
ws.onerror = () => console.log('WebSocket:', '❌ Connection Failed');
ws.onclose = () => console.log('WebSocket:', '🔄 Connection Closed');

// Check Local Storage
const state = localStorage.getItem('tnf-panel-state');
console.log('Panel State:', state || 'Default');

setTimeout(() => {
  ws.close();
  console.log('Health check complete!');
}, 3000);
```

## 📞 Getting Help

If issues persist:

1. **Run the test script**: `./test-chrome-extension-fixes.sh`
2. **Check the logs**: Look for error messages in browser console
3. **Verify setup**: Follow CHROME_EXTENSION_FINAL_FIXES_COMPLETE.md
4. **Reset everything**: Clear extension data and restart browser

---

**Last Updated:** $(date)  
**Status:** 🟢 Ready for Use
