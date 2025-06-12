# 🚀 The New Fuse Chrome Extension

## 📋 Quick Start

### 1. Install Dependencies
```bash
# From project root
npm install ws
# or
bun install ws
```

### 2. Start WebSocket Server
```bash
# Terminal 1: Start the WebSocket server
node launchWebSocketServer.js
```

### 3. Load Chrome Extension
1. Open Chrome → Extensions (chrome://extensions/)
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `chrome-extension/` folder
5. Extension should appear with "The New Fuse" icon

### 4. Test Functionality
1. Open any webpage
2. Press **Ctrl+Shift+F** to show/hide panel
3. Click "Connect" to connect to WebSocket server
4. Test element detection and chat relay

## 🎯 Features

✅ **Floating Resizable Panel** - Draggable interface overlay  
✅ **WebSocket Chat Relay** - Real-time communication with AI agents  
✅ **Element Detection** - Auto-detect and manually select page elements  
✅ **Server Management** - Start/stop WebSocket server integration  
✅ **Chrome API Safe** - Works with and without Chrome extension APIs  
✅ **Cross-Page Compatible** - Functions on most websites  

## 🔧 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Content       │    │   Background     │    │   WebSocket     │
│   Script        │◄──►│   Script         │◄──►│   Server        │
│   (UI Panel)    │    │   (Management)   │    │   (Chat Relay)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
    Web Page              Chrome Extension         Node.js Process
```

## 📁 File Structure

```
chrome-extension/
├── manifest.json              # Extension configuration
├── content.js                 # Main UI and functionality
├── background.js              # Service worker management
├── popup.html                 # Extension popup (optional)
├── popup.js                   # Popup functionality
├── icons/                     # Extension icons
└── README.md                  # This file

../
├── launchWebSocketServer.js   # WebSocket server launcher
├── test-websocket-server-3710.cjs  # Base WebSocket server
└── src/background/server-manager.ts # Server management logic
```

## ⚙️ Configuration

### Default Settings:
- **WebSocket URL**: `ws://localhost:3710`
- **Panel Position**: Top-right corner
- **Keyboard Shortcut**: Ctrl+Shift+F

### Customization:
```javascript
// In browser console, modify settings:
localStorage.setItem('tnf-websocket-url', 'ws://localhost:3711');
localStorage.setItem('tnf-panel-position', JSON.stringify({x: 100, y: 100}));
```

## 🐛 Troubleshooting

### Common Issues:

**Panel Not Showing:**
- Press Ctrl+Shift+F to toggle
- Check if extension is enabled in Chrome
- Clear local storage: `localStorage.clear()`

**WebSocket Connection Failed:**
- Ensure server is running: `node launchWebSocketServer.js`
- Check port availability: `lsof -i :3710`
- Try different port in panel settings

**Element Detection Not Working:**
- Check page compatibility (some sites block content scripts)
- Try manual selection mode
- Refresh page and retry

### Debug Mode:
```javascript
// Enable debug logging in browser console
localStorage.setItem('tnf-debug', 'true');
// Reload page to see detailed logs
```

## 🚀 Development

### Building:
```bash
# No build step required - direct JavaScript files
# For TypeScript version, see src/ directory
```

### Testing:
```bash
# Run validation script
./test-chrome-extension-fixes.sh

# Manual testing checklist:
# 1. Extension loads without errors
# 2. Panel shows/hides with keyboard shortcut
# 3. WebSocket connects to running server
# 4. Element detection works on test pages
# 5. Chat relay functions properly
```

### Debugging:
```
1. Chrome DevTools → Console (content script logs)
2. Extensions → Inspect views: background page
3. Network tab → WebSocket connections
4. Local Storage → tnf-* keys
```

## 📚 API Reference

### Content Script Events:
```javascript
// Show/hide panel
window.postMessage({ type: 'TNF_TOGGLE_PANEL' }, '*');

// Force WebSocket connection
window.postMessage({ type: 'TNF_CONNECT_WEBSOCKET' }, '*');

// Reset element selection
window.postMessage({ type: 'TNF_RESET_ELEMENTS' }, '*');
```

### WebSocket Message Format:
```javascript
// Outgoing message
{
  type: 'chat_message',
  content: 'User message text',
  timestamp: Date.now(),
  elements: { input: selector, button: selector, output: selector }
}

// Incoming message
{
  type: 'ai_response',
  content: 'AI response text',
  action: 'fill_input' | 'click_button' | 'extract_output'
}
```

## 🔗 Related Files

- **Main Documentation**: `../CHROME_EXTENSION_FINAL_FIXES_COMPLETE.md`
- **Troubleshooting**: `../TROUBLESHOOTING_GUIDE.md`
- **Server Launcher**: `../launchWebSocketServer.js`
- **Test Script**: `../test-chrome-extension-fixes.sh`

---

**Version:** 2.1.0  
**Status:** 🟢 Production Ready  
**Last Updated:** $(date)
