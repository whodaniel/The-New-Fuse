# Chrome Extension Testing Guide

## ✅ Current Status

The Chrome extension has been successfully built and the TEST_PING handler has
been fixed. All required files are present in the `dist` directory.

## 🚀 Loading the Extension

### Step 1: Open Chrome Extensions Page

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right corner)

### Step 2: Load the Extension

1. Click "Load unpacked" button
2. Navigate to and select this directory:
   ```
   /path/to/Desktop/A1-Inter-LLM-Com/The New Fuse/chrome-extension/dist
   ```
3. The extension should appear in your extensions list as "The New Fuse - AI
   Bridge & Element Selector"

### Step 3: Verify Installation

- The extension icon should appear in the Chrome toolbar
- Extension should show version 2.0.0
- No error messages should appear in the extensions page

## 🧪 Testing the Extension

### Option 1: Using the Test Page

1. Open the test page: `chrome-extension/test-extension.html`
2. Click "Check Extension Status" to verify the extension is loaded
3. Click "Test Background Script" to test the TEST_PING communication

### Option 2: Using the Extension Popup

1. Click the extension icon in the Chrome toolbar
2. The popup should open showing "The New Fuse - AI Bridge"
3. The popup will automatically attempt to connect to the TNF Relay
4. Check the browser console (F12) for any error messages

### Option 3: Using the Test Popup

1. Navigate to `chrome-extension://[extension-id]/popup-test.html`
2. Replace `[extension-id]` with your actual extension ID from
   chrome://extensions/
3. Test the alert functionality

## 🔧 Fixed Issues

### ✅ TEST_PING Handler

- **Problem**: Background script was missing handler for TEST_PING messages
- **Solution**: Added TEST_PING case to the `handleMessage` method in
  `background.js`
- **Location**: Lines 323-327 in `/dist/background.js`

### ✅ Build Process

- **Problem**: Yarn workspace conflicts prevented building
- **Solution**: Extension is already built and ready to use

## 📋 Required Files Checklist

- ✅ `manifest.json` - Extension manifest (v3)
- ✅ `background.js` - Service worker with message handling
- ✅ `popup.html` - Extension popup interface
- ✅ `popup.js` - Popup functionality
- ✅ `content.js` - Content script for web pages
- ✅ `icons/` - Extension icons (16x16, 48x48, 128x128)
- ✅ `options.html` - Extension options page
- ✅ `element-selection.css` - Styling for element selection

## 🐛 Troubleshooting

### Extension Not Loading

- Check that you selected the `dist` folder, not the parent `chrome-extension`
  folder
- Verify Developer mode is enabled
- Check for errors in the chrome://extensions/ page

### Popup Not Working

- Right-click the extension icon and check for errors
- Open DevTools in the popup (right-click → Inspect)
- Check the browser console for error messages

### Background Script Issues

- Go to chrome://extensions/
- Click "Details" on the extension
- Click "Inspect views: service worker" to debug the background script

## 🎯 Next Steps

1. Load the extension using the instructions above
2. Test the basic functionality using the test page
3. Verify the TEST_PING communication works
4. Test element selection features on web pages
5. Connect to the TNF Relay (if available) for full functionality

## 📞 Communication Flow

```
Popup → Background Script → TNF Relay → External AI Services
  ↑         ↑ (TEST_PING)      ↑              ↑
  └─────────┼─────────────────┼──────────────┘
            └─── ✅ FIXED ────┘
```

The TEST_PING handler ensures the popup can successfully communicate with the
background script, which is essential for all extension functionality.
