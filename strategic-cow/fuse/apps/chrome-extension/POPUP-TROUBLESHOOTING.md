# The New Fuse Chrome Extension - Popup Troubleshooting Guide

This guide provides detailed steps to fix popup UI issues with The New Fuse
Chrome extension.

## Issue: Popup UI Not Showing

If the popup UI doesn't appear when clicking on the extension icon, follow these
troubleshooting steps:

### 1. Check for WebSocket Server

The extension tries to connect to a WebSocket server running at
`ws://localhost:8080`. Make sure the WebSocket server is running:

```bash
# Navigate to the extension directory
cd /path/to/Desktop/A1-Inter-LLM-Com/The New Fuse/chrome-extension

# Install ws package if needed
npm install ws

# Start the test WebSocket server
node test-websocket-server.js
```

### 2. Rebuild the Extension

If you've made changes to fix the issues, rebuild the extension:

```bash
# Navigate to the extension directory
cd /path/to/Desktop/A1-Inter-LLM-Com/The New Fuse/chrome-extension

# Run the build script
./build.sh
```

### 3. Check Chrome Developer Console

Check for errors in the Chrome Developer Console:

1. Open Chrome Extensions page (chrome://extensions/)
2. Enable "Developer mode" in the top-right corner
3. Find The New Fuse extension
4. Click on "background page" to open the DevTools for the background script
5. Click on the extension icon and then inspect the popup page (right-click >
   Inspect)
6. Check the Console tab for error messages

### 4. Verify Popup HTML

Make sure the popup HTML structure is correct:

1. The popup.html file should exist in the dist directory
2. It should contain a `<div id="root"></div>` element
3. It should correctly load the popup.js and popup.css files

### 5. Fix Common Issues

The following fixes have been applied:

- Added error handling for WebSocket initialization
- Improved popup rendering code with better error handling
- Fixed issues with the popup's React component structure
- Added a test WebSocket server for development

### 6. Reload the Extension

After making changes:

1. Go to chrome://extensions/
2. Find The New Fuse extension
3. Click the reload icon (circular arrow)
4. Try clicking the extension icon again to see if the popup appears

## Advanced Troubleshooting

If the above steps don't resolve the issue:

1. Check the manifest.json to ensure it correctly defines the popup
   (default_popup: "popup.html")
2. Verify all required JavaScript files are correctly included in the build
3. Check for any CSP (Content Security Policy) issues in the console
4. Try disabling other extensions that might interfere
5. Test in an Incognito window to rule out extension conflicts

For further assistance, please file an issue in the project repository.
